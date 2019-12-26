import React, { useState } from "react";
import moment from "moment";
import { AutoSizer, List, ListRowProps } from 'react-virtualized';

export interface LogEntry {
  timestamp: moment.Moment,
  text: string,
}

export interface LogEntryRowProps {
  entry: LogEntry,
  timestamp: boolean,
  style: React.CSSProperties,
}

export const LogEntryRow: React.FC<LogEntryRowProps> = (props) => {
  const entry = props.entry;
  return (<div className="LogEntryRow" style={props.style}>
    {props.timestamp && <div className="LogEntryRow__Timestamp">{entry.timestamp.format('HH:mm:ss.SSSSSS')}</div>}
    <div className="LogEntryRow__Text">{entry.text}</div>
  </div>)
}

export const LogEntryList: React.FC<{ logs: LogEntry[], showTimestamp: boolean }> = (props) => {
  const [lastRenderedBefore, setLastRenderedBefore] = useState(false);

  return (<AutoSizer>
    {({ width, height }) =>
      <List
        height={height}
        rowHeight={32}
        rowRenderer={({ index, key, style }: ListRowProps) => {
          setLastRenderedBefore(index === props.logs.length - 1);
          return (<LogEntryRow key={key} entry={props.logs[index]} style={style} timestamp={props.showTimestamp} />);
        }}
        rowCount={props.logs.length}
        scrollToIndex={lastRenderedBefore ? props.logs.length - 1 : undefined}
        width={width}
      />
    }
  </AutoSizer>);
};
