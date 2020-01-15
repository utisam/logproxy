import { blue, grey, red, yellow } from "@material-ui/core/colors";
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import 'react-virtualized/styles.css';
import './App.css';
import { LogEntry, LogEntryLevelSetting, LogEntryList } from './components/LogEntry';
import { LevelPattern, LogStreamSettings, LogStreamSettingsPanel } from './components/LogStreamSettings';
import { useQueue } from './hooks';

interface RawLogEntry {
  timestamp: moment.Moment,
  text: string,
}

type LogEntryEventHandler = (entry: RawLogEntry) => void

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

function useLogs(pattern: LevelPattern) {
  const [logs, enqueueLogs] = useQueue<LogEntry>(100000);

  useEffect(() => {
    logEntryEventSource.addLogEntryListener((rawEntry) => {
      let level = "", text = rawEntry.text;

      const res = pattern.regexp.exec(rawEntry.text);
      if (res && 2 <= res.length) {
        level = res[1];
        text = text.slice(res[0].length);
      }

      enqueueLogs({
        timestamp: rawEntry.timestamp,
        text: text,
        level: level,
      })
    });
  }, [enqueueLogs, pattern]);

  return logs;
}

const LogStreamPanel: React.FC = () => {
  const [settings, setSettings] = useState<LogStreamSettings>({
    showTimestamp: true,
    pattern: {
      regexp: /^<(.*)>: /,
      level: "$1",
    },
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

  const levelSettings = useMemo((): Map<string, LogEntryLevelSetting> => {
    return new Map(settings.levels.map(lv => [lv.name, lv]));
  }, [settings.levels]);

  const logs = useLogs(settings.pattern);

  // TODO: Parse levels
  // TODO: Search text

  return (<div style={{flexGrow: 1, display: "flex", flexDirection: "column"}}>
    <LogStreamSettingsPanel settings={settings} onChanged={useCallback((change: Partial<LogStreamSettings>) => {
      setSettings((settings) => ({...settings, ...change}));
    }, [setSettings])} />
    <div style={{flexGrow: 1}}>
      <LogEntryList logs={logs} showTimestamp={settings.showTimestamp} levelSettings={levelSettings} />
    </div>
  </div>);
};

// const WidgetsPanel: React.FC = () => {
//   const [batteries, enqueueBatteries] = useQueue<number>(5);

//   useEffect(() => {
//     logEntryEventSource.addLogEntryListener((entry) => {
//       const res = /app: battery = (\d+)/.exec(entry.text);
//       if (res) {
//         enqueueBatteries(parseInt(res[1]));
//       }
//     });
//   }, [enqueueBatteries]);

//   return (<div className="WidgetsPanel">Last battery: {batteries.join(", ")}</div>);
// };

const App: React.FC = () => {
  return (
    <div className="App">
      <LogStreamPanel />
      {/* <WidgetsPanel /> */}
    </div>
  );
};

export default App;
