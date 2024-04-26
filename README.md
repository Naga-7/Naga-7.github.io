# Conditional Image Editor

## Live Site https://nagamoon7.github.io/

## Quick Notes

- Mask - *Polygon*: Create 3 or more points by left-clicking on the canvas. To fill the polygon, press *a* or *A*. To cancel, press *Escape*.
  
- Base Image:  The conditions will be based on this image. On the settings, you can *Save* which will put the *Current Image* into *Base Image* or *Reset* which will do the opposite.

- Conditions: Hue or *H* is a wheel gradient but for simplicity I did as a straight line. In a wheel, after 359° you go back to 0°, which means you can target values like 340° to 20° for example. To achieve that effect with a straight line, *Start* must be greater than *End*.

- Change HSL: *Multiply* and *Sum* stacks. *Multiply* won't affect pixels with saturation and/or light with a value of 0, the lesser the value the less the pixel will be affected, so usually you use that to avoid unsaturated or dark pixels.
