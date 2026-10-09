import { ItemShop } from '@/components/rewards/ItemShop';
import { SipagBalance } from '@/components/rewards/SipagBalance';
import { TaraScreen } from '@/components/tara/TaraScreen';
import { useT } from '@/lib/i18n/translate';

/** The item shop tab: companions, auras and outfits bought with Sipag. */
export default function Tindahan() {
  const t = useT();
  return (
    <TaraScreen title={t('Shop', 'Tindahan')} subtitle={t('Companions, auras and outfits for your hero.', 'Kasama, aura at damit para sa bida mo.')}>
      <SipagBalance />
      <ItemShop />
    </TaraScreen>
  );
}
