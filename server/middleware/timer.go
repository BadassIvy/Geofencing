package middleware

import (
	"encoding/json"
	"strconv"
	"time"
)

func TimedResponse(data any, start time.Time) map[string]any {
	b, _ := json.Marshal(data)
	var result map[string]any
	if err := json.Unmarshal(b, &result); err != nil || result == nil {
		result = map[string]any{"data": data}
	}
	result["time_ns"] = strconv.FormatInt(time.Since(start).Nanoseconds(), 10)
	return result
}