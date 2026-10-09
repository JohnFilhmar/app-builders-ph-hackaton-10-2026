describe('harness', () => {
  it('runs in the Manila time zone', () => {
    expect(new Date(Date.UTC(2026, 9, 9, 16, 0)).getDate()).toBe(10);
  });
});
