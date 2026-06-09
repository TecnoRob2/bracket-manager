import React, { Fragment } from 'react';
import styled from 'styled-components';

const Bracket = styled.div`
  display: flex;
  flex-direction: row;
  @media (max-width: ${(props) => props.mobileBreakpoint}px) {
    flex-direction: column;
  }
`;

const Round = styled.div`
  flex: 0;
  display: flex;
  flex-direction: column;
  @media (max-width: ${(props) => props.mobileBreakpoint}px) {
    min-width: 0;
  }
`;

const RoundTitle = styled.div`
  color: var(--bracket-muted, #8f8f8f);
  font-weight: 400;
  text-align: center;
`;

const SeedsList = styled.div`
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  flex-flow: row wrap;
  justify-content: center;
  height: 100%;
  list-style: none;
`;

const SeedItem = styled.div`
  color: var(--bracket-seed-text, #fff) !important;
  width: 100%;
  background-color: ${(props) => props.$hasClash ? 'rgba(220, 38, 38, 0.4) !important' : 'var(--bracket-seed-bg, #1a1d2e)'};
  padding: 0;
  border-radius: 0.2em;
  box-shadow: ${(props) => props.$hasClash ? '0 0 12px rgba(239, 68, 68, 0.6) !important' : '0 2px 4px -2px var(--bracket-seed-shadow, #111630)'};
  border: ${(props) => props.$hasClash ? '1px solid #ef4444 !important' : '1px solid transparent'};
  text-align: center;
  position: relative;
  transition: all 0.2s ease;
`;

const SeedTeam = styled.div`
  padding: 0.3rem 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 0.2em;
`;

const SeedTime = styled.div`
  margin-top: 2px;
  font-size: 12px;
  color: var(--bracket-muted, #8f8f8f);
  height: 0;
  @media (max-width: ${(props) => props.mobileBreakpoint}px) {
    height: auto;
  }
`;

const SingleLineSeed = styled.div`
  padding: 1em 1.5em;
  min-width: 225px;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  flex: 0 1 auto;
  flex-direction: column;
  justify-content: center;
  font-size: 14px;
  @media (max-width: ${(props) => props.mobileBreakpoint}px) {
    width: 100%;
  }
  @media (min-width: ${(props) => (props.mobileBreakpoint || 0) + 1}px) {
    &::after {
      content: "";
      position: absolute;
      height: 50%;
      width: 3em;
      [dir='rtl'] & {
        left: -1.5em;
      }
      [dir='twoSided'] & {
        left: -1.5em;
      }
      [dir='ltr'] & {
        right: -1.5em;
      }
    }
    &:nth-child(even)::after {
      border-bottom: 1px solid var(--bracket-line, #707070);
      top: -0.5px;
    }
    &:nth-child(odd)::after {
      border-top: 1px solid var(--bracket-line, #707070);
      top: calc(50% - 0.5px);
    }
  }
`;

const Seed = styled.div`
  padding: 1em 1.5em;
  min-width: 225px;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  flex: 0 1 auto;
  flex-direction: column;
  justify-content: center;
  font-size: 14px;
  @media (max-width: ${(props) => props.mobileBreakpoint}px) {
    width: 100%;
  }
  @media (min-width: ${(props) => (props.mobileBreakpoint || 0) + 1}px) {
    &::after {
      content: "";
      position: absolute;
      height: 50%;
      width: 1.5em;
      [dir='rtl'] & {
        left: 0px;
      }
      [dir='ltr'] & {
        right: 0px;
      }
    }

    &:nth-child(even)::before {
      content: '';
      border-top: 1px solid var(--bracket-line, #707070);
      position: absolute;
      top: -0.5px;
      width: 1.5em;
      [dir='rtl'] & {
        left: -1.5em;
      }
      [dir='ltr'] & {
        right: -1.5em;
      }
    }

    &:nth-child(even)::after {
      border-bottom: 1px solid var(--bracket-line, #707070);
      top: -0.5px;
      [dir='rtl'] & {
        border-left: 1px solid var(--bracket-line, #707070);
      }
      [dir='ltr'] & {
        border-right: 1px solid var(--bracket-line, #707070);
      }
    }
    &:nth-child(odd):not(:last-child)::after {
      border-top: 1px solid var(--bracket-line, #707070);
      top: calc(50% - 0.5px);
      [dir='rtl'] & {
        border-left: 1px solid var(--bracket-line, #707070);
      }
      [dir='ltr'] & {
        border-right: 1px solid var(--bracket-line, #707070);
      }
    }
  }
`;


const renderTitle = (title) => <RoundTitle>{title}</RoundTitle>;

const renderSeed = ({ seed, breakpoint, isMiddleOfTwoSided }) => {
  const Wrapper = isMiddleOfTwoSided ? SingleLineSeed : Seed;

  return (
    <Wrapper mobileBreakpoint={breakpoint}>
      <SeedItem>
        <div>
          <SeedTeam>{seed?.teams?.[0]?.name || '-----------'}</SeedTeam>
          <SeedTeam>{seed?.teams?.[1]?.name || '-----------'}</SeedTeam>
        </div>
      </SeedItem>
      <SeedTime mobileBreakpoint={breakpoint}>{seed?.date}</SeedTime>
    </Wrapper>
  );
};

const SingleElimination = ({
  rounds,
  rtl = false,
  roundClassName,
  bracketClassName,
  mobileBreakpoint = 992,
  twoSided = false,
  renderSeedComponent = renderSeed,
  roundTitleComponent = renderTitle,
}) => {
  const getFragment = (seed, roundIdx, idx, roundsValue, isMiddleOfTwoSided) => (
    <Fragment key={seed.id}>
      {renderSeedComponent({
        seed,
        breakpoint: mobileBreakpoint,
        roundIndex: roundIdx,
        seedIndex: idx,
        rounds: roundsValue,
        isMiddleOfTwoSided,
      })}
    </Fragment>
  );

const data = rounds.map((round, roundIdx) => (
    <Round key={round.title} className={roundClassName} mobileBreakpoint={mobileBreakpoint}>
      {round.title && roundTitleComponent(round.title, roundIdx)}
      <SeedsList>
        {round.seeds.map((seed, idx) => getFragment(seed, roundIdx, idx, rounds, false))}
      </SeedsList>
    </Round>
  ));

  const getRenderedRounds = (
    roundsStartIndex,
    roundsEndIndex,
    renderFirstHalfOfRoundsSeeds,
    roundsValue,
    dir,
  ) =>
    roundsValue.slice(roundsStartIndex, roundsEndIndex).map((round, roundIdx) => (
      <Round key={round.title} className={roundClassName} mobileBreakpoint={mobileBreakpoint}>
        {round.title && roundTitleComponent(round.title, roundIdx)}
        <SeedsList dir={dir}>
          {(renderFirstHalfOfRoundsSeeds
            ? round.seeds.slice(0, round.seeds.length / 2)
            : round.seeds.slice(round.seeds.length / 2, round.seeds.length)
          ).map((seed, idx) =>
            getFragment(seed, roundIdx, idx, roundsValue, roundIdx < roundsEndIndex - 2),
          )}
        </SeedsList>
      </Round>
    ));

  if (twoSided) {
    return (
      <Bracket className={bracketClassName} mobileBreakpoint={mobileBreakpoint}>
        {getRenderedRounds(0, rounds.length - 1, true, rounds, 'ltr')}
        {getRenderedRounds(rounds.length - 1, rounds.length, false, rounds, 'twoSided')}
        {getRenderedRounds(1, rounds.length, false, [...rounds].reverse(), 'rtl')}
      </Bracket>
    );
  }

  return (
    <Bracket
      className={bracketClassName}
      dir={rtl ? 'rtl' : 'ltr'}
      mobileBreakpoint={mobileBreakpoint}
    >
      {data}
    </Bracket>
  );
};

export { SingleElimination as Bracket, Seed, SeedItem, SeedTeam, SeedTime, SingleLineSeed };