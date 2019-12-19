package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/alexandrevicenzi/go-sse"
)

type LogEntry struct {
	Timestamp time.Time `json:"timestamp"`
	Text      string    `json:"text"`
}

func main() {
	s := sse.NewServer(nil)
	defer s.Shutdown()

	dir := http.Dir("./web/build")
	http.Handle("/events/", s)
	http.Handle("/", http.FileServer(dir))

	go func() {
		for {
			scanner := bufio.NewScanner(os.Stdin)
			for scanner.Scan() {
				text := scanner.Text()

				entry := LogEntry{
					Timestamp: time.Now(),
					Text:      text,
				}

				json, err := json.Marshal(&entry)
				if err != nil {
					fmt.Fprintf(os.Stderr, "err: %s", err.Error())
					continue
				}

				fmt.Print("stdin: " + text)
				s.SendMessage("/events/log", sse.SimpleMessage(string(json)))
			}
			if err := scanner.Err(); err != nil {
				fmt.Println(err)
			}
		}
	}()

	http.ListenAndServe(":8080", nil)
}
