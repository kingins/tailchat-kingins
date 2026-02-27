import { useGlobalSocketEvent, useWatch } from '@capital/common';
import { UserAvatar, UserName } from '@capital/component';
import React, { useEffect, useState } from 'react';
import { useRoomParticipants } from '../utils/useRoomParticipants';
import _uniqBy from 'lodash/uniqBy';
import styled from 'styled-components';

const ParticipantList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 2px 0 2px 8px;
`;

const ParticipantRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  line-height: 20px;
  opacity: 0.8;
  overflow: hidden;

  & > span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
  }
`;

const MoreCount = styled.div`
  font-size: 11px;
  opacity: 0.55;
  padding-left: 22px;
`;

export const LivekitPanelBadge: React.FC<{
  groupId: string;
  panelId: string;
}> = React.memo((props) => {
  const roomName = `${props.groupId}#${props.panelId}`;
  const { participants, fetchParticipants } = useRoomParticipants(roomName);
  const [displayParticipants, setDisplayParticipants] = useState<
    {
      sid: string;
      identity: string;
    }[]
  >([]);

  useWatch([participants.length], () => {
    setDisplayParticipants(participants);
  });

  useEffect(() => {
    fetchParticipants();
  }, []);

  useGlobalSocketEvent(
    'plugin:com.msgbyte.livekit.participantJoined',
    (payload: any) => {
      if (
        payload.groupId === props.groupId &&
        payload.panelId === props.panelId &&
        payload.participant
      ) {
        setDisplayParticipants((state) =>
          _uniqBy([...state, payload.participant], 'sid')
        );
      }
    }
  );

  useGlobalSocketEvent(
    'plugin:com.msgbyte.livekit.participantLeft',
    (payload: any) => {
      if (
        payload.groupId === props.groupId &&
        payload.panelId === props.panelId &&
        payload.participant
      ) {
        setDisplayParticipants((state) => {
          const index = state.findIndex(
            (item) => item.sid === payload.participant.sid
          );
          if (index >= 0) {
            const fin = [...state];
            fin.splice(index, 1);
            return fin;
          } else {
            return [...state];
          }
        });
      }
    }
  );

  if (displayParticipants.length === 0) {
    return null;
  }

  const visibleList = displayParticipants.slice(0, 5);
  const overflow = displayParticipants.length - visibleList.length;

  return (
    <ParticipantList>
      {visibleList.map((info) => (
        <ParticipantRow key={info.sid}>
          <UserAvatar userId={info.identity} size={16} />
          <UserName userId={info.identity} />
        </ParticipantRow>
      ))}
      {overflow > 0 && <MoreCount>+{overflow}</MoreCount>}
    </ParticipantList>
  );
});
LivekitPanelBadge.displayName = 'LivekitPanelBadge';

export default LivekitPanelBadge;
