import Icon from './Icon.jsx';

/**
 * The absence of a photograph, stated rather than left as a hole.
 *
 * A lot with no image previously reserved a full 4:3 box on the detail page,
 * which rendered as roughly 1030x780 of empty ground with one small glyph in
 * the middle. An instrument with no reading shows a short ruled scale and says
 * so; it does not leave a room.
 */
export default function NoImagePlate({ compact = false }) {
  if (compact) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-sunken text-steel-bright">
        <Icon name="inventory_2" className="text-[24px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-sunken px-t4 py-t12">
      <Icon name="inventory_2" className="text-[32px] text-steel-bright" />
      <div className="scale-rule my-t3 w-24 opacity-40" aria-hidden />
      <p className="legend text-tick text-lume-faint">No photograph supplied</p>
    </div>
  );
}
