package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type adminStats struct {
	DBOK          bool       `json:"db_ok"`
	Hosts         int64      `json:"hosts"`
	ActiveHosts   int64      `json:"active_hosts"`
	Probes        int64      `json:"probes"`
	Samples       int64      `json:"samples"`
	LastSampleAt  *time.Time `json:"last_sample_at"`
	DatabaseBytes int64      `json:"database_bytes"`
}

func (s *Server) AdminStats(c *gin.Context) {
	ctx := requestContext(c)
	stats := adminStats{}

	if err := s.Pool.Ping(ctx); err != nil {
		c.JSON(http.StatusOK, stats)
		return
	}
	stats.DBOK = true

	err := s.Pool.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM endpoints),
			(SELECT COUNT(*) FROM endpoints WHERE active),
			(SELECT COUNT(*) FROM probes),
			(SELECT COUNT(*) FROM samples),
			(SELECT MAX(ts) FROM samples),
			(SELECT pg_database_size(current_database()))
	`).Scan(&stats.Hosts, &stats.ActiveHosts, &stats.Probes, &stats.Samples, &stats.LastSampleAt, &stats.DatabaseBytes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load admin stats"})
		return
	}
	c.JSON(http.StatusOK, stats)
}
