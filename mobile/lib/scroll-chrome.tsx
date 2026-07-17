import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Animated } from "react-native";

type ScrollChromeContextValue = {
  hidden: boolean;
  /** 0 = visible, 1 = hidden */
  progress: Animated.Value;
  reportScroll: (y: number) => void;
  show: () => void;
  tabBarHeight: number;
  setTabBarHeight: (h: number) => void;
};

const ScrollChromeContext = createContext<ScrollChromeContextValue | null>(null);

const DOWN_DELTA = 10;
const UP_DELTA = 8;
const TOP_REVEAL = 24;

export function ScrollChromeProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const [tabBarHeight, setTabBarHeight] = useState(64);
  const progress = useRef(new Animated.Value(0)).current;
  const lastY = useRef(0);
  const hiddenRef = useRef(false);

  const animateTo = useCallback(
    (nextHidden: boolean) => {
      if (hiddenRef.current === nextHidden) return;
      hiddenRef.current = nextHidden;
      setHidden(nextHidden);
      Animated.timing(progress, {
        toValue: nextHidden ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    },
    [progress]
  );

  const show = useCallback(() => {
    lastY.current = 0;
    animateTo(false);
  }, [animateTo]);

  const reportScroll = useCallback(
    (y: number) => {
      const prev = lastY.current;
      const delta = y - prev;
      lastY.current = y;

      if (y <= TOP_REVEAL) {
        animateTo(false);
        return;
      }

      if (delta > DOWN_DELTA) animateTo(true);
      else if (delta < -UP_DELTA) animateTo(false);
    },
    [animateTo]
  );

  const value = useMemo(
    () => ({ hidden, progress, reportScroll, show, tabBarHeight, setTabBarHeight }),
    [hidden, progress, reportScroll, show, tabBarHeight]
  );

  return <ScrollChromeContext.Provider value={value}>{children}</ScrollChromeContext.Provider>;
}

export function useScrollChrome() {
  const ctx = useContext(ScrollChromeContext);
  if (!ctx) {
    return {
      hidden: false,
      progress: new Animated.Value(0),
      reportScroll: (_y: number) => {},
      show: () => {},
      tabBarHeight: 64,
      setTabBarHeight: (_h: number) => {},
    };
  }
  return ctx;
}

/** Drop this on FlatList / ScrollView onScroll for Facebook-style chrome. */
export function useChromeScrollHandler(extra?: (y: number) => void) {
  const { reportScroll } = useScrollChrome();
  return useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const y = e.nativeEvent.contentOffset.y;
      reportScroll(y);
      extra?.(y);
    },
    [reportScroll, extra]
  );
}
