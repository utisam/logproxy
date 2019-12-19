package main

import (
	"bufio"
	"fmt"
	"net/http"
	"os"

	"github.com/alexandrevicenzi/go-sse"
)

func main() {
	s := sse.NewServer(nil)
	defer s.Shutdown()

	dir := http.Dir("./static")
	http.Handle("/events/", s)
	http.Handle("/", http.FileServer(dir))

	go func() {
		for {
			scanner := bufio.NewScanner(os.Stdin)
			for scanner.Scan() {
				text := scanner.Text()
				fmt.Print("stdin: " + text)
				s.SendMessage("/events/log", sse.SimpleMessage(text))
			}
			if err := scanner.Err(); err != nil {
				fmt.Println(err)
			}
		}
	}()

	http.ListenAndServe(":8080", nil)
}
