package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

func (s *Server) GetHostPrefs(c *gin.Context) {
	userID, ok := s.lookupUserID(c)
	if !ok {
		return
	}
	var hostIDs []int64
	err := s.Pool.QueryRow(requestContext(c),
		`SELECT host_ids FROM user_host_prefs WHERE user_id = $1`, userID,
	).Scan(&hostIDs)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusOK, gin.H{"host_ids": []int64{}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load host prefs"})
		return
	}
	if hostIDs == nil {
		hostIDs = []int64{}
	}
	c.JSON(http.StatusOK, gin.H{"host_ids": hostIDs})
}

func (s *Server) PutHostPrefs(c *gin.Context) {
	userID, ok := s.lookupUserID(c)
	if !ok {
		return
	}
	var input struct {
		HostIDs []int64 `json:"host_ids"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "host_ids array is required"})
		return
	}
	if input.HostIDs == nil {
		input.HostIDs = []int64{}
	}
	if len(input.HostIDs) > 0 {
		var count int
		if err := s.Pool.QueryRow(requestContext(c),
			`SELECT COUNT(*) FROM endpoints WHERE id = ANY($1)`, input.HostIDs,
		).Scan(&count); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not validate host ids"})
			return
		}
		unique := uniqueInt64(input.HostIDs)
		if count != len(unique) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "one or more host ids are invalid"})
			return
		}
		input.HostIDs = unique
	}
	if _, err := s.Pool.Exec(requestContext(c), `
		INSERT INTO user_host_prefs (user_id, host_ids, updated_at)
		VALUES ($1, $2, now())
		ON CONFLICT (user_id) DO UPDATE SET host_ids = EXCLUDED.host_ids, updated_at = now()`,
		userID, input.HostIDs,
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save host prefs"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"host_ids": input.HostIDs})
}

func uniqueInt64(values []int64) []int64 {
	seen := make(map[int64]struct{}, len(values))
	out := make([]int64, 0, len(values))
	for _, v := range values {
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
		out = append(out, v)
	}
	return out
}
