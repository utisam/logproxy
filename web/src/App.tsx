import { blue, grey, red, yellow } from "@material-ui/core/colors";
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react';
import 'react-virtualized/styles.css';
import './App.css';
import { LogEntry, LogEntryList } from './components/LogEntry';
import { LogStreamSettings, LogStreamSettingsPanel } from './components/LogStreamSettings';
import { useQueue } from './hooks';


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
  const [logs, enqueueLogs] = useQueue<LogEntry>(100000);

  useEffect(() => {
    logEntryEventSource.addLogEntryListener(enqueueLogs);
  }, [enqueueLogs]);

  return logs;
}

const LogStreamPanel: React.FC = () => {
  const [settings, setSettings] = useState<LogStreamSettings>({
    showTimestamp: true,
    patterns: [
      {
        regexp: /^<(.*)>: /,
        level: "$1",
      },
    ],
    levels: [
      {
        name: "error",
        color: red,
        enabled: true,
      },
      {
        name: "warning",
        color: yellow,
        enabled: true,
      },
      {
        name: "info",
        color: blue,
        enabled: true,
      },
      {
        name: "debug",
        color: grey,
        enabled: false,
      },
    ],
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
