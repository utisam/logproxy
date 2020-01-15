import { Color } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import moment from "moment";
import React, { useState } from "react";
import { AutoSizer, List, ListRowProps } from 'react-virtualized';

export interface LogEntry {
  timestamp: moment.Moment,
  level: string,
  text: string,
}

export interface LogEntryLevelSetting {
  color?: Color,
  enabled: boolean
}

export interface LogEntryRowProps {
  style: React.CSSProperties,
  entry: LogEntry,
  showTimestamp: boolean,
  setting?: LogEntryLevelSetting,
}

const defaultLogEntryRowProps: LogEntryLevelSetting = {
  color: grey,
  enabled: true,
};

export const LogEntryRow: React.FC<LogEntryRowProps> = (props) => {
  const entry = props.entry;
  const setting = props.setting || defaultLogEntryRowProps;
  return (<div className="LogEntryRow" style={props.style}>
    {props.showTimestamp && <div className="LogEntryRow__Timestamp">{entry.timestamp.format('HH:mm:ss.SSSSSS')}</div>}
    {props.entry.level && <div className="LogEntryRow__Level" style={{backgroundColor: (setting.color ?? grey)[300]}}>{entry.level}</div>}
    <div className="LogEntryRow__Text">{entry.text}</div>
  </div>)
}

export interface LogEntryListProps {
  logs: LogEntry[],
  showTimestamp: boolean,
  levelSettings: Map<string, LogEntryLevelSetting>,
}

export const LogEntryList: React.FC<LogEntryListProps> = (props) => {
  const [lastRenderedBefore, setLastRenderedBefore] = useState(false);

  return (<AutoSizer>
    {({ width, height }) =>
      <List
        height={height}
        rowHeight={32}
        rowRenderer={({ index, key, style }: ListRowProps) => {
          setLastRenderedBefore(index === props.logs.length - 1);
          const log = props.logs[index];
          return (<LogEntryRow
            key={key}
            style={style}
            entry={log}
            showTimestamp={props.showTimestamp}
            setting={props.levelSettings.get(log.level)} />);
        }}
        rowCount={props.logs.length}
        scrollToIndex={lastRenderedBefore ? props.logs.length - 1 : undefined}
        width={width}
      />
    }
  </AutoSizer>);
};
