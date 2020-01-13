package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/alexandrevicenzi/go-sse"
)

type LogEntry struct {
	Timestamp time.Time `json:"timestamp"`
	Text      string    `json:"text"`
}

func scanLogs(logEntryCh chan<- LogEntry) {
	go func() {
		scanner := bufio.NewScanner(os.Stdin)
		for scanner.Scan() {
			if err := scanner.Err(); err != nil {
				fmt.Println(err)
				close(logEntryCh)
				return
			}

			text := scanner.Text()

			logEntryCh <- LogEntry{
				Timestamp: time.Now(),
				Text:      text,
			}

			fmt.Println("stdin: " + text)
		}
	}()
}

func createFrontenHandler() http.Handler {
	frontend := os.Getenv("LOGPROXY_FRONTEND")
	if frontend == "" {
		frontend = "./web/build"
	}

	if strings.HasPrefix(frontend, "http://") {
		devServer, _ := url.Parse(frontend)
		return httputil.NewSingleHostReverseProxy(devServer)
	} else {
		return http.FileServer(http.Dir(frontend))
	}
}

func main() {
	logEntryCh := make(chan LogEntry)
	scanLogs(logEntryCh)

	s := sse.NewServer(nil)
	defer s.Shutdown()

	startOnce := sync.Once{}
	http.Handle("/events/", http.HandlerFunc(func(resp http.ResponseWriter, req *http.Request) {
		startOnce.Do(func() {
			go func() {
				for entry := range logEntryCh {
					json, err := json.Marshal(&entry)
					if err != nil {
						fmt.Fprintf(os.Stderr, "err: %s\n", err.Error())
						continue
					}

					s.SendMessage("/events/log", sse.SimpleMessage(string(json)))
				}
			}()
		})
		s.ServeHTTP(resp, req)
	}))

	http.Handle("/", createFrontenHandler())

	http.ListenAndServe(":8080", nil)
}
