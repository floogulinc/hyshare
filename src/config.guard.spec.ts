import { ConfigGuard } from './config/config.guard';

xdescribe('ConfigGuard', () => {
  it('should be defined', () => {
    expect(new ConfigGuard()).toBeDefined();
  });
});
