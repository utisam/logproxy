import React, { useCallback, ChangeEvent } from "react";
import { FormGroup, FormControlLabel, Checkbox, withStyles, CheckboxProps, Color } from "@material-ui/core";
import { red, grey, yellow, blue } from "@material-ui/core/colors";

export enum LabelCategory {
  Error,
  Warning,
  Info,
  Debug,
}

export function LabelCategoryToColor(category?: LabelCategory): Color {
  switch (category) {
    case LabelCategory.Error: return red;
    case LabelCategory.Warning: return yellow;
    case LabelCategory.Info: return blue;
  }

  return grey;
}

export interface LabelSetting {
  name: string,
  category?: LabelCategory,
  enabled: boolean
}

export interface LogStreamSettings {
  labels: LabelSetting[],
  showTimestamp: boolean,
}

export type LogStreamSettingsChangedHandler = (settings: Partial<LogStreamSettings>) => void;

export interface LogStreamPanelProps {
  settings: LogStreamSettings,
  onChanged: LogStreamSettingsChangedHandler,
}

interface LabelCheckboxProps {
  label: LabelSetting,
  index: number,
  labels: LabelSetting[],
  onChanged: LogStreamSettingsChangedHandler,
}

const LabelCheckbox: React.FC<LabelCheckboxProps> = (props) => {
  const onChanged = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    props.labels[props.index].enabled = event.target.checked;
    props.onChanged({
      labels: props.labels,
    });
  }, [props]);

  const color = LabelCategoryToColor(props.label.category);
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
    control={<ColoredCheckbox checked={props.label.enabled} onChange={onChanged} />}
    label={props.label.name}
  />
};

export const LogStreamSettingsPanel: React.FC<LogStreamPanelProps> = (props) => {
  const onTimestampChanged = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    props.onChanged({
      showTimestamp: event.target.checked,
    });
  }, [props]);

  return (<div className="LogStreamSettingsPanel">
    <FormGroup row>
      {props.settings.labels.map((label, index, labels) => <LabelCheckbox key={index} label={label} index={index} labels={labels} onChanged={props.onChanged} />)}
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