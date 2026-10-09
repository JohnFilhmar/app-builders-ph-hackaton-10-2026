import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { Segmented } from '@/components/Segmented';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { TaraBubble } from '@/components/tara/TaraBubble';
import { TaraScreen } from '@/components/tara/TaraScreen';
import { useT } from '@/lib/i18n/translate';
import { fetchBoard, joinBoard, syncLedger } from '@/lib/leaderboard/leaderboardApi';
import { useGameStore } from '@/lib/stores/gameStore';
import { useLeaderboardStore } from '@/lib/stores/leaderboardStore';
import { useSetupStore } from '@/lib/stores/setupStore';
import { PALETTE } from '@/lib/theme/palette';
import type { Board, BoardPeriod, BoardRow } from '@/types/leaderboard';
import { errorMessage } from '@/utils/errorMessage';

function Row({ row, isMe }: { row: BoardRow; isMe: boolean }) {
  const medal = row.rank <= 3 ? [PALETTE.sipag400, '#C9CCD1', '#D99A5B'][row.rank - 1] : undefined;
  return (
    <PolyFrame cut={8} fill={isMe ? PALETTE.sipag300 : PALETTE.white} stroke={isMe ? PALETTE.sipag600 : PALETTE.banig300}>
      <View className="flex-row items-center gap-3 px-3 py-2.5">
        <View className="h-9 w-9 items-center justify-center" style={medal ? { backgroundColor: medal } : undefined}>
          <Text className="font-num text-base text-ink-900">{row.rank}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-ink-900">{row.username}</Text>
          <Text className="font-pixel text-xs text-tara-700">Lv. {row.level}</Text>
        </View>
        <Text className="font-num text-base text-ink-900">{row.xp}</Text>
      </View>
    </PolyFrame>
  );
}

/**
 * The Ranks tab: join once with a username, then see who earned the most Sipag this week or overall. The phone sends
 * its ledger and the server recomputes everyone's XP with the game rules, so the board shows what was really earned.
 * Offline, it says so; progress on the phone is never at risk.
 */
export default function Ranggo() {
  const t = useT();
  const backendUrl = useSetupStore((s) => s.backendUrl);
  const username = useLeaderboardStore((s) => s.username);
  const setUsername = useLeaderboardStore((s) => s.setUsername);
  const [name, setName] = useState('');
  const [period, setPeriod] = useState<BoardPeriod>('week');
  const [board, setBoard] = useState<Board | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const refresh = useCallback(
    async (which: BoardPeriod) => {
      setIsBusy(true);
      setProblem(null);
      try {
        await syncLedger(backendUrl, useGameStore.getState().events);
        setBoard(await fetchBoard(backendUrl, which));
      } catch (err) {
        setProblem(errorMessage(err));
      }
      setIsBusy(false);
    },
    [backendUrl],
  );

  useFocusEffect(
    useCallback(() => {
      if (username) void refresh(period);
    }, [username, period, refresh]),
  );

  const join = async () => {
    setIsBusy(true);
    setProblem(null);
    try {
      setUsername(await joinBoard(backendUrl, name.trim()));
    } catch (err) {
      setProblem(errorMessage(err));
    }
    setIsBusy(false);
  };

  if (!username) {
    return (
      <TaraScreen title={t('Ranks', 'Ranggo')} subtitle={t('See how your Sipag stacks up against other players.', 'Tingnan ang Sipag mo kumpara sa ibang manlalaro.')}>
        <TaraBubble text={t('Pick a username for the board. Not your real name, please! It stays with this phone until you uninstall the app.', 'Pumili ng username para sa board. Huwag ang totoong pangalan! Mananatili ito sa phone na ito hangga’t hindi mo ina-uninstall ang app.')} />
        <Card title={t('Join the board', 'Sumali sa board')}>
          <Field label={t('Username', 'Username')} value={name} onChangeText={(v) => setName(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="bida_123" autoCapitalize="none" maxLength={16} />
          <Text className="text-sm text-tara-700">{t('3 to 16 letters, numbers or _.', '3 hanggang 16 na letra, numero o _.')}</Text>
          <Button label={t('Join', 'Sumali')} icon="plus" isBusy={isBusy} disabled={name.trim().length < 3} onPress={() => void join()} />
          {problem ? <Text className="text-sm text-tara-700">{problem}</Text> : null}
        </Card>
      </TaraScreen>
    );
  }

  const me = board?.me;
  const isMeShown = me ? board.rows.some((r) => r.rank === me.rank) : true;
  return (
    <TaraScreen title={t('Ranks', 'Ranggo')} subtitle={t(`Playing as ${username}`, `Naglalaro bilang ${username}`)}>
      <Segmented
        options={[
          { value: 'week', label: t('This week', 'Ngayong linggo'), icon: 'flame' },
          { value: 'all', label: t('All time', 'Lahat'), icon: 'trophy' },
        ]}
        value={period}
        onChange={setPeriod}
      />
      {problem ? <TaraBubble text={t(`I can't reach the leaderboard right now (${problem}). Your progress is safe on this phone.`, `Hindi ko maabot ang leaderboard ngayon (${problem}). Ligtas ang progress mo sa phone na ito.`)} /> : null}
      {board && board.rows.length === 0 ? <TaraBubble text={t('No one on the board yet. Finish a quest and be first!', 'Wala pang tao sa board. Tapusin ang isang Gawain at mauna ka!')} /> : null}
      <View className="gap-2">
        {board?.rows.map((row) => (
          <Row key={row.rank} row={row} isMe={row.rank === me?.rank} />
        ))}
        {me && !isMeShown ? (
          <>
            <Text className="text-center font-pixel text-tara-700">...</Text>
            <Row row={me} isMe />
          </>
        ) : null}
      </View>
      {board ? (
        <Text className="text-center text-xs text-tara-500">
          {t(`${board.players} players · ${period === 'week' ? 'Sipag earned in the last 7 days' : 'all Sipag earned'}`, `${board.players} manlalaro · ${period === 'week' ? 'Sipag sa nakaraang 7 araw' : 'lahat ng Sipag'}`)}
        </Text>
      ) : null}
      <Button label={t('Refresh', 'I-refresh')} variant="secondary" icon={null} isBusy={isBusy} onPress={() => void refresh(period)} />
    </TaraScreen>
  );
}
