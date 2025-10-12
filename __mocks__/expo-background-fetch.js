export const BackgroundFetch = {
  BackgroundFetchResult: {
    NewData: 'newData',
    NoData: 'noData',
    Failed: 'failed'
  },
  registerTaskAsync: jest.fn(),
  unregisterTaskAsync: jest.fn()
};

export default BackgroundFetch;