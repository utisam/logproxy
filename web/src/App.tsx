import { blue, grey, red, yellow } from "@material-ui/core/colors";
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import 'react-virtualized/styles.css';
import './App.css';
import { LevelCounts, LogEntries, LogEntryLevelSetting, LogEntryList } from './components/LogEntry';
import { LevelPattern, LogStreamSettings, LogStreamSettingsPanel } from './components/LogStreamSettings';

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

function incrementLevelCounts(counts: LevelCounts, level: string) {
  return {...counts, [level]: counts[level] + 1 || 1};
}

const logEntryMax = 10000;

function useLogEntryList(pattern: LevelPattern, levelSettings: Map<string, LogEntryLevelSetting>) {
  const [logEntryList, setLogEntryList] = useState<LogEntries>({entries: [], levelCountOffsets: {}});

  useEffect(() => {
    logEntryEventSource.addLogEntryListener((rawEntry) => {
      let level = "", text = rawEntry.text;

      const res = pattern.regexp.exec(rawEntry.text);
      if (res && 2 <= res.length && levelSettings.has(res[1])) {
        level = res[1];
        text = text.slice(res[0].length);
      }

      setLogEntryList(({entries, levelCountOffsets}: LogEntries) => {
        const lastEntry = entries[entries.length - 1] || {};

        const nextEntries = [...entries.slice(-(logEntryMax - 1)), {
          timestamp: rawEntry.timestamp,
          text: text,
          level: level,
          levelCounts: incrementLevelCounts(lastEntry.levelCounts || Object.create(null), level),
        }];

        if (entries.length === logEntryMax) {
          const first = entries[0];
          levelCountOffsets = incrementLevelCounts(levelCountOffsets, first.level);
        }

        return {
          entries: nextEntries,
          levelCountOffsets: levelCountOffsets,
        };
      });
    });
  }, [setLogEntryList, pattern]);

  return logEntryList;
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
        name: "",
        color: grey,
        enabled: true,
      },
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
        enabled: true,
      },
    ],
  });

  const levelSettings = useMemo((): Map<string, LogEntryLevelSetting> => {
    return new Map(settings.levels.map(lv => [lv.name, lv]));
  }, [settings.levels]);

  const enableLevels = useMemo((): Set<string> => {
    return new Set(settings.levels.filter(lv => lv.enabled).map(lv => lv.name));
  }, [settings.levels]);

  const logEntries = useLogEntryList(settings.pattern, levelSettings);

  // TODO: Parse levels
  // TODO: Search text

  const onLogStreamSettingsChanged = useCallback((change: Partial<LogStreamSettings>) => {
    setSettings((settings) => ({...settings, ...change}));
  }, [setSettings]);

  return (<div style={{flexGrow: 1, display: "flex", flexDirection: "column"}}>
    <LogStreamSettingsPanel settings={settings} onChanged={onLogStreamSettingsChanged} />
    <div style={{flexGrow: 1}}>
      <LogEntryList logEntries={logEntries} showTimestamp={settings.showTimestamp} levelSettings={levelSettings} enableLevels={enableLevels} />
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
