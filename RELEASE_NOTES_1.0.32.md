# ISPConfig HERITAGE 1.0.32

HERITAGE 1.0.32 gives boolean table states a compact, consistent presentation.
Active, locked and remote-access columns now use accessible state indicators
instead of spending the width of a normal content column. The visible German
heading `Remotezugriff` is shortened to `Remote`; its full meaning remains
available to screen readers and as a tooltip.

The row-action column retains a stable usable width, leaving more room for names,
domains and other meaningful content. The responsive boundary was reverified in
both colour schemes: the complete icon-and-label main navigation remains visible
at 721 pixels, while the mobile drawer is used below 670 pixels.

The release remains theme-only. ISPConfig controllers, permissions, stored
values and managed server operations are unchanged.
