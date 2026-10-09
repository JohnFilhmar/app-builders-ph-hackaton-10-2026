import { DescribeImagePanel } from '@/components/DescribeImagePanel';
import { ImageGenPanel } from '@/components/ImageGenPanel';
import { Screen } from '@/components/Screen';

export default function VisionScreen() {
  return (
    <Screen title="Vision" subtitle="Image recognition and generation">
      <DescribeImagePanel />
      <ImageGenPanel />
    </Screen>
  );
}
