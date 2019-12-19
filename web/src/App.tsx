import moment from 'moment';
import React, { useEffect, useState } from 'react';
import './App.css';


interface LogEntry {
  timestamp: moment.Moment,
  text: string,
}

const eventSource = new EventSource('/events/log');

const LogList: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  useEffect(() => {
    eventSource.addEventListener('message', (event) => {
      const entry = JSON.parse(event.data);

      setLogs((logs) => [...logs, {
        timestamp: moment(entry['timestamp']),
        text: entry['text'] || '',
      }]);
    });
  }, []);
  useEffect(() => {
    const lastEntries = document.getElementsByClassName('last-entry');
    if (lastEntries.length > 0) {
      lastEntries[0].scrollIntoView();
    }
  }, [logs]);

  return (<ul>
    {logs.map((entry, idx) => <li key={idx} className={(idx == logs.length - 1) ? "last-entry" :""}>[{entry.timestamp.format('HH:MM:SS')}] {entry.text}</li>)}
  </ul>);
}

const App: React.FC = () => {
  return (
    <div className="App">
      <LogList />
    </div>
  );
}

export default App;
