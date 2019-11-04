import {SupervisionStrategy, SupervisionStrategyCreationOptions} from '../../types/supervision';

export const DefaultOneForOneStrategyOptions: SupervisionStrategyCreationOptions = {
  maxRetries: 5,
  timeThreshold: 10000
};

export function oneForOneStrategy(options?: SupervisionStrategyCreationOptions): SupervisionStrategy {
  const opts = Object.assign({}, DefaultOneForOneStrategyOptions, options || {});
  const solidOptions = {
    maxRetries: () => opts.maxRetries,
    timeThreshold: () => opts.timeThreshold    
  };

  return {
    options: () => solidOptions
  };
}
