import moment from 'moment';
import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { AutoSizer, List, ListRowProps } from 'react-virtualized';
import 'react-virtualized/styles.css';
import './App.css';

interface LogEntry {
  timestamp: moment.Moment,
  text: string,
}

interface LogEntryRowProps {
  entry: LogEntry,
  timestamp: boolean,
  style: React.CSSProperties,
}

const LogEntryRow: React.FC<LogEntryRowProps> = (props) => {
  const entry = props.entry;
  return (<div className="LogEntryRow" style={props.style}>
    {props.timestamp && <div className="LogEntryRow__Timestamp">{entry.timestamp.format('HH:mm:ss.SSSSSS')}</div>}
    <div className="LogEntryRow__Text">{entry.text}</div>
  </div>)
}

const LogEntryList: React.FC<{logs: LogEntry[], timestamp: boolean}> = (props) => {
  return (<AutoSizer>
      {({width, height}) =>
        <List
          height={height}
          rowHeight={32}
          rowRenderer={({index, key, style}: ListRowProps) => (
            <LogEntryRow key={key} entry={props.logs[index]} style={style} timestamp={props.timestamp} />
          )}
          rowCount={props.logs.length}
          scrollToIndex={props.logs.length - 1}
          width={width}
          />
      }
    </AutoSizer>);
}


type LogEntryEventHandler = (entry: LogEntry) => void

class LogEntryEventSource {

  private handlers: Set<LogEntryEventHandler> = new Set();

  constructor() {
    const eventSource = new EventSource('/events/log');
    eventSource.addEventListener('message', this.onMessage.bind(this));
  }

  private onMessage(event: MessageEvent) {
    const data = JSON.parse(event.data);
    const entry = {
      timestamp: moment(data['timestamp']),
      text: data['text'] || '',
    };

    for (let handler of this.handlers) {
      handler(entry);
    }
  }

  public addLogEntryListener(handler: LogEntryEventHandler) {
    this.handlers.add(handler);
  }

  public removeLogEntryListener(handler: LogEntryEventHandler) {
    this.handlers.delete(handler);
  }
}

const logEntryEventSource = new LogEntryEventSource();

function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    logEntryEventSource.addLogEntryListener((entry) => {
      setLogs((logs: LogEntry[]) => [...logs.slice(-100000), {
        timestamp: moment(entry['timestamp']),
        text: entry['text'] || '',
      }]);
    });
  }, []);

  return logs;
}

interface LogStreamSettings {
  timestamp: boolean,
}

interface LogStreamPanelProps {
  settings: LogStreamSettings,
  onChanged: ((settings: Partial<LogStreamSettings>) => void),
}

const LogStreamSettingsPanel: React.FC<LogStreamPanelProps> = (props) => {
  const onTimestampChanged = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    props.onChanged({
      timestamp: event.target.checked,
    });
  }, [props]);

  return (<div className="LogStreamSettingsPanel">
    <label>
      <input type="checkbox" onChange={onTimestampChanged} checked={props.settings.timestamp} />
      Show Timestamp
    </label>
  </div>);
};

const LogStreamPanel: React.FC = () => {
  const [settings, setSettings] = useState<LogStreamSettings>({
    timestamp: true,
  });

  const logs = useLogs();

  return (<div style={{flexGrow: 1, display: "flex", flexDirection: "column"}}>
    <LogStreamSettingsPanel settings={settings} onChanged={useCallback((change: Partial<LogStreamSettings>) => {
      setSettings({...settings, ...change});
    }, [setSettings, settings])} />
    <div style={{flexGrow: 1}}>
      <LogEntryList logs={logs} timestamp={settings.timestamp} />
    </div>
  </div>);
};

const WidgetsPanel: React.FC = () => {
  const [latestLog, setLatestLog] = useState<number | null>(null);

  useEffect(() => {
    logEntryEventSource.addLogEntryListener((entry) => {
      const res = /app: battery = (\d+)/.exec(entry.text);
      if (res) {
        setLatestLog(parseInt(res[1]));
      }
    });
  }, []);

  return (<div className="WidgetsPanel">Last battery: {latestLog || ""}</div>);
};

const App: React.FC = () => {
  return (
    <div className="App">
      <LogStreamPanel />
      <WidgetsPanel />
    </div>
  );
};

export default App;
