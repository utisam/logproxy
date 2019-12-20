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

const LogEntryList: React.FC<{logs: LogEntry[], showTimestamp: boolean}> = (props) => {
  const [lastRenderedBefore, setLastRenderedBefore] = useState(false);

  return (<AutoSizer>
      {({width, height}) =>
        <List
          height={height}
          rowHeight={32}
          rowRenderer={({index, key, style}: ListRowProps) => {
            setLastRenderedBefore(index === props.logs.length - 1);
            return (<LogEntryRow key={key} entry={props.logs[index]} style={style} timestamp={props.showTimestamp} />);
          }}
          rowCount={props.logs.length}
          scrollToIndex={lastRenderedBefore ? props.logs.length - 1 : undefined}
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

function useQueue<T>(maximum: number, initial: T[] = []): [T[], (item: T) => void] {
  const [queue, setQueue] = useState(initial);

  const enqueue = useCallback((item: T) => {
    setQueue((queue) => [...queue.slice(-(maximum - 1)), item]);
  }, [maximum, setQueue]);

  return [queue, enqueue]
}

function useLogs() {
  const [logs, enqueueLogs] = useQueue<LogEntry>(100000);

  useEffect(() => {
    console.log("addLogEntryListener")
    logEntryEventSource.addLogEntryListener(enqueueLogs);
  }, [enqueueLogs]);

  return logs;
}

interface LogStreamSettings {
  showTimestamp: boolean,
}

interface LogStreamPanelProps {
  settings: LogStreamSettings,
  onChanged: ((settings: Partial<LogStreamSettings>) => void),
}

const LogStreamSettingsPanel: React.FC<LogStreamPanelProps> = (props) => {
  const onTimestampChanged = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    props.onChanged({
      showTimestamp: event.target.checked,
    });
  }, [props]);

  return (<div className="LogStreamSettingsPanel">
    <label>
      <input type="checkbox" onChange={onTimestampChanged} checked={props.settings.showTimestamp} />
      Show Timestamp
    </label>
  </div>);
};

const LogStreamPanel: React.FC = () => {
  const [settings, setSettings] = useState<LogStreamSettings>({
    showTimestamp: true,
  });

  const logs = useLogs();

  // TODO: Parse levels
  // TODO: Search text

  return (<div style={{flexGrow: 1, display: "flex", flexDirection: "column"}}>
    <LogStreamSettingsPanel settings={settings} onChanged={useCallback((change: Partial<LogStreamSettings>) => {
      setSettings((settings) => ({...settings, ...change}));
    }, [setSettings])} />
    <div style={{flexGrow: 1}}>
      <LogEntryList logs={logs} showTimestamp={settings.showTimestamp} />
    </div>
  </div>);
};

const WidgetsPanel: React.FC = () => {
  const [batteries, enqueueBatteries] = useQueue<number>(5);

  useEffect(() => {
    logEntryEventSource.addLogEntryListener((entry) => {
      const res = /app: battery = (\d+)/.exec(entry.text);
      if (res) {
        enqueueBatteries(parseInt(res[1]));
      }
    });
  }, [enqueueBatteries]);

  return (<div className="WidgetsPanel">Last battery: {batteries.join(", ")}</div>);
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
