import { Checkbox, CheckboxProps, Color, FormControlLabel, FormGroup, withStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import React, { ChangeEvent, useCallback } from "react";

export interface LevelSetting {
  name: string,
  color?: Color,
  enabled: boolean
}

export interface LevelPattern {
  regexp: RegExp,
  level: string,
}

export interface LogStreamSettings {
  pattern: LevelPattern
  levels: LevelSetting[],
  showTimestamp: boolean,
}

export type LogStreamSettingsChangedHandler = (settings: Partial<LogStreamSettings>) => void;

export interface LogStreamPanelProps {
  settings: LogStreamSettings,
  onChanged: LogStreamSettingsChangedHandler,
}

export type LevelCheckboxChangedHandler = (settings: Partial<LevelSetting>, index: number) => void;

interface LevelCheckboxProps {
  level: LevelSetting,
  index: number,
  onChanged: LevelCheckboxChangedHandler,
}

const LevelCheckbox: React.FC<LevelCheckboxProps> = (props) => {
  const onChanged = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    props.onChanged({
      enabled: event.target.checked,
    }, props.index);
  }, [props]);

  const color = props.level.color || grey;
  const ColoredCheckbox = withStyles({
    root: {
      color: color[800],
      '&$checked': {
        color: color[900],
      },
    },
    checked: {},
  })((props: CheckboxProps) => <Checkbox color="default" {...props} />)

  return <FormControlLabel
    control={<ColoredCheckbox checked={props.level.enabled} onChange={onChanged} />}
    label={props.level.name}
  />
};

export const LogStreamSettingsPanel: React.FC<LogStreamPanelProps> = (props) => {
  const onTimestampChanged = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    props.onChanged({
      showTimestamp: event.target.checked,
    });
  }, [props]);

  const onLevelCheckboxChanged = useCallback((settings: Partial<LevelSetting>, index: number) => {
    props.onChanged({
      levels: props.settings.levels.map((s, i) => {
        if (i === index) {
          return {...s, ...settings};
        }
        return s;
      }),
    });
  }, [props]);

  return (<div className="LogStreamSettingsPanel">
    <FormGroup row>
      {props.settings.levels.map((label, index) => <LevelCheckbox key={index} level={label} index={index} onChanged={onLevelCheckboxChanged} />)}
    </FormGroup>
    <FormGroup row>
      <FormControlLabel
        control={
          <Checkbox checked={props.settings.showTimestamp} onChange={onTimestampChanged} color="primary" />
        }
        label="Show Timestamp"
      />
    </FormGroup>
  </div>);
};
