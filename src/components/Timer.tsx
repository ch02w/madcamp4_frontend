import React from 'react';
import FlipClockCountdown from '@leenguyen/react-flip-clock-countdown';
import '@leenguyen/react-flip-clock-countdown/dist/index.css';
import './Timer.css';

interface TimerProps {
  remainingTime: number;
}

const Timer: React.FC<TimerProps> = ({ remainingTime }) => {
  return (
    <div className="timer-container">
      <div className="timer">
        <FlipClockCountdown
          to={Date.now() + remainingTime}
          renderMap={[false, false, true, true]}
          labels={['', '', '', 'Seconds']}
          showLabels={false}
          hideOnComplete={false}
          duration={0.5}
        />
      </div>
    </div>
  );
};

export default Timer;
