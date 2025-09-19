import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { ANIMATION } from '../constants';

// Hook for entrance animations
export const useEntranceAnimation = (duration = ANIMATION.slow) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: duration + 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: duration + 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return {
    fadeAnim,
    slideAnim,
    scaleAnim,
    animatedStyle: {
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
    },
  };
};

// Hook for staggered animations
export const useStaggeredAnimation = (
  count,
  delay = ANIMATION.stagger.card
) => {
  const animations = useRef(
    Array(count)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animationSequence = animations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: ANIMATION.normal * 2,
        delay: index * delay,
        useNativeDriver: true,
      })
    );

    Animated.stagger(delay, animationSequence).start();
  }, []);

  return animations;
};

// Hook for scale animation on press
export const useScaleAnimation = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: ANIMATION.fast,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: ANIMATION.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    scaleAnim,
    animatePress,
    animatedStyle: {
      transform: [{ scale: scaleAnim }],
    },
  };
};

// Hook for bounce animation
export const useBounceAnimation = (autoStart = false) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const startBounce = () => {
    Animated.spring(bounceAnim, {
      toValue: 1,
      tension: 100,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (autoStart) {
      startBounce();
    }
  }, [autoStart]);

  return {
    bounceAnim,
    startBounce,
    animatedStyle: {
      transform: [{ scale: bounceAnim }],
    },
  };
};
