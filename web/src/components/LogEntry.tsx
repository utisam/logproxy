import { Color } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import moment from "moment";
import React, { useState } from "react";
import { AutoSizer, List, ListRowProps } from 'react-virtualized';

export type LevelCounts = {[key: string]: number};

export interface LogEntry {
  timestamp: moment.Moment,
  level: string,
  text: string,
  levelCounts: LevelCounts,
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

export interface LogEntries {
  entries: LogEntry[],
  levelCountOffsets: LevelCounts,
}

export interface LogEntryListProps {
  logEntries: LogEntries,
  showTimestamp: boolean,
  levelSettings: Map<string, LogEntryLevelSetting>,
  enableLevels: Set<string>,
}

function renderedCount(entry: LogEntry, enableLevels: Set<string>) {
  return Object.entries(entry.levelCounts)
    .filter(([level, _]: [string, number]) => enableLevels.has(level))
    .map(([_, count]: [string, number]) => count)
    .reduce((count: number, current: number) => current + count, 0);
}

function countRendered(logEntries: LogEntries, enableLevels: Set<string>): number {
  const length = logEntries.entries.length;
  if (length === 0) return 0;
  return renderedCount(logEntries.entries[length - 1], enableLevels);
}

function indexOfRendered(logEntries: LogEntries, enableLevels: Set<string>, index: number, begin: number, end: number): number {
  if (begin === end) {
    return -1;
  }

  const med = Math.floor((begin + end) / 2);
  const medEntry = logEntries.entries[med];
  const shownLogIndex = renderedCount(medEntry, enableLevels) - 1;
  if (shownLogIndex === -1 || shownLogIndex < index) {
    return indexOfRendered(logEntries, enableLevels, index, med + 1, end);
  } else if (shownLogIndex > index || !enableLevels.has(medEntry.level)) {
    return indexOfRendered(logEntries, enableLevels, index, begin, med);
  }
  return med;
}

export const LogEntryList: React.FC<LogEntryListProps> = (props) => {
  const [lastRenderedBefore, setLastRenderedBefore] = useState(false);

  const shownLogCount = countRendered(props.logEntries, props.enableLevels);

  return (<AutoSizer>
    {({ width, height }) =>
      <List
        height={height}
        rowHeight={32}
        rowRenderer={({ index, key, style }: ListRowProps) => {
          setLastRenderedBefore(index === shownLogCount - 1);

          const logIndex = indexOfRendered(props.logEntries, props.enableLevels, index, 0, props.logEntries.entries.length);

          const entry = props.logEntries.entries[logIndex];
          return (<LogEntryRow
            key={key}
            style={style}
            entry={entry}
            showTimestamp={props.showTimestamp}
            setting={props.levelSettings.get(entry.level)} />);
        }}
        rowCount={shownLogCount}
        scrollToIndex={lastRenderedBefore ? shownLogCount - 1 : undefined}
        width={width}
      />
    }
  </AutoSizer>);
};
