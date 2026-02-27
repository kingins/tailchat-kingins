import { useParticipants } from '@livekit/components-react';
import * as React from 'react';
import styled from 'styled-components';
import { Icon, UserListItem } from '@capital/component';
import { useEvent } from '@capital/common';
import type { Participant, RemoteParticipant } from 'livekit-client';
import { Translate } from '../../translate';

const MemberList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: clamp(200px, 55ch, 60ch);
  background-color: var(--lk-bg2);
  border-left: 1px solid var(--lk-border-color);
  padding: 8px;
`;

const IsSpeakingTip = styled.div`
  font-size: 12px;
  opacity: 0.6;
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 4px;
`;

const VolumeSlider = styled.input`
  width: 56px;
  height: 3px;
  cursor: pointer;
  accent-color: var(--lk-accent-color, #2dd4bf);
  vertical-align: middle;

  /* cross-browser track reset */
  -webkit-appearance: none;
  appearance: none;
  background: transparent;

  &::-webkit-slider-runnable-track {
    height: 3px;
    background: var(--lk-border-color, #444);
    border-radius: 2px;
  }
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--lk-accent-color, #2dd4bf);
    margin-top: -4.5px;
    cursor: pointer;
  }
  &::-moz-range-track {
    height: 3px;
    background: var(--lk-border-color, #444);
    border-radius: 2px;
  }
  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border: none;
    border-radius: 50%;
    background: var(--lk-accent-color, #2dd4bf);
    cursor: pointer;
  }
`;

export const Member: React.FC = React.memo(() => {
  const participants = useParticipants();
  const [volumes, setVolumes] = React.useState<Record<string, number>>({});

  const handleVolumeChange = useEvent(
    (participant: RemoteParticipant, value: number) => {
      participant.setVolume(value);
      setVolumes((prev) => ({ ...prev, [participant.sid]: value }));
    }
  );

  const getAction = useEvent((participant: Participant) => {
    const isRemote = !participant.isLocal;
    const currentVolume = volumes[participant.sid] ?? 1;

    return [
      participant.isSpeaking && (
        <IsSpeakingTip key="speaking">({Translate.isSpeaking})</IsSpeakingTip>
      ),
      isRemote && (
        <VolumeControl key="volume" title={Translate.volume}>
          <Icon
            icon={
              currentVolume === 0 ? 'mdi:volume-off' : 'mdi:volume-high'
            }
            style={{ fontSize: '14px', cursor: 'pointer', flexShrink: 0 }}
            onClick={() =>
              handleVolumeChange(
                participant as RemoteParticipant,
                currentVolume === 0 ? 1 : 0
              )
            }
          />
          <VolumeSlider
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={currentVolume}
            onChange={(e) =>
              handleVolumeChange(
                participant as RemoteParticipant,
                parseFloat(e.target.value)
              )
            }
            onClick={(e) => e.stopPropagation()}
          />
        </VolumeControl>
      ),
      <div key="mic-state">
        {participant.isMicrophoneEnabled ? (
          <Icon icon="mdi:microphone" />
        ) : (
          <Icon icon="mdi:microphone-off" />
        )}
      </div>,
    ];
  });

  return (
    <MemberList>
      {participants.map((member) => (
        <UserListItem
          key={member.sid}
          userId={member.identity}
          actions={getAction(member)}
        />
      ))}
    </MemberList>
  );
});
Member.displayName = 'Member';
