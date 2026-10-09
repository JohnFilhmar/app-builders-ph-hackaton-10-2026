import { mentionedObjects, saidYes } from '@/lib/checks/objectList';

describe('mentionedObjects', () => {
  it('finds household objects in a description, in order, singular', () => {
    expect(mentionedObjects('A white paper cup with a straw sits on a wooden desk next to two laptops and some glasses.')).toEqual(['cup', 'straw', 'laptop', 'glass']);
  });

  it('ignores scenery and caps the list', () => {
    expect(mentionedObjects('An empty table by the wall.')).toEqual([]);
    expect(mentionedObjects('pen, book, mug, phone, bottle', 3)).toEqual(['pen', 'book', 'mug']);
  });
});

describe('saidYes', () => {
  it('reads short answers', () => {
    expect(saidYes('Yes.')).toBe(true);
    expect(saidYes('No, there is not.')).toBe(false);
    expect(saidYes('There is a cup on the table.')).toBe(true);
  });
});
