import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { AutoSizer, List, ListRowProps } from 'react-virtualized';
import 'react-virtualized/styles.css';
import './App.css';

interface LogEntry {
  timestamp: moment.Moment,
  text: string,
}

interface LogEntryRowProps {
  entry: LogEntry,
  style: React.CSSProperties,
}

const LogEntryRow: React.FC<LogEntryRowProps> = (props) => {
  const entry = props.entry;
  return (<div className="LogEntryRow" style={props.style}>
    <div className="LogEntryRow__Timestamp">{entry.timestamp.format('HH:mm:ss.SSSSSS')}</div>
    <div>{entry.text}</div>
  </div>)
}


const LogEntryList: React.FC<{logs: LogEntry[]}> = (props) => {
  return (<AutoSizer>
      {({width, height}) =>
        <List
        height={height}
        rowHeight={32}
        rowRenderer={({index, key, style}: ListRowProps) => (
          <LogEntryRow key={key} entry={props.logs[index]} style={style} />
          )}
          rowCount={props.logs.length}
          scrollToIndex={props.logs.length - 1}
          width={width}
          />
        }
    </AutoSizer>);
}

const App: React.FC = () => {
  // const logs = [
  //   { timestamp: moment(), text: "aaa" },
  //   { timestamp: moment(), text: "aaa" },
  //   { timestamp: moment(), text: "aaa" },
  //   { timestamp: moment(), text: "aaa" },
  //   { timestamp: moment(), text: "aaa" },
  // ];

  const [logs, setLogs] = useState<LogEntry[]>([]);
  useEffect(() => {
    const eventSource = new EventSource('/events/log');
    eventSource.addEventListener('message', (event) => {
      const entry = JSON.parse(event.data);

      setLogs((logs: LogEntry[]) => [...logs, {
        timestamp: moment(entry['timestamp']),
        text: entry['text'] || '',
      }]);
    });
  }, []);

  return (
    <div className="App">
      <LogEntryList logs={logs} />
    </div>
  );
}

export default App;
