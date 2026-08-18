import { Grid } from 'antd';

export function useBreakpoint() {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  return { isMobile, screens };
}

export function useModalWidth(desktopWidth = 560) {
  const { isMobile } = useBreakpoint();
  return isMobile ? 'calc(100vw - 32px)' : desktopWidth;
}
