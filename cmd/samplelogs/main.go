package main

import (
	"fmt"
	"time"
)

var patterns = []string{
	"<debug>: debug message 1",
	"<debug>: debug message 2",
	"<info>: info message",
	"<error>: error message",
	"<warning>: warning message",
	"<unexpected>: unexpected message",
	"no level message",
}

func main() {
	index := 0
	for {
		fmt.Println(patterns[index])
		index = (index + 1) % len(patterns)
		time.Sleep(20 * time.Millisecond)
	}
}
