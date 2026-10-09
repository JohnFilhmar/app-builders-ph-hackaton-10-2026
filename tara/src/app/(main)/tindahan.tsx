import { ItemShop } from '@/components/rewards/ItemShop';
import { SipagBalance } from '@/components/rewards/SipagBalance';
import { TaraScreen } from '@/components/tara/TaraScreen';
import { useT } from '@/lib/i18n/translate';

/** The item shop tab: backdrops, frames and auras bought with Sipag. */
export default function Tindahan() {
  const t = useT();
  return (
    <TaraScreen title={t('Shop', 'Tindahan')} subtitle={t('Backdrops, frames and auras for your hero.', 'Tanawin, kuwadro at aura para sa bida mo.')}>
      <SipagBalance />
      <ItemShop />
    </TaraScreen>
  );
}
