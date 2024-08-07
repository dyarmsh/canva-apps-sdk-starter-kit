import React, { useState} from "react";
import { Rows, Text, Swatch, Title, Alert, Box, Button } from "@canva/app-ui-kit";
import { Color } from "@canva/preview/asset";
import { findRecoms } from "./utils";
import { addNativeElement } from "@canva/design";
import { NativeSimpleElementWithBox } from "@canva/preview/design";

type RecommendationsProps = {
    fgColour: string;
    bgColour: string;
  };
  
export const RecommendationsComponent: React.FC<RecommendationsProps> = ({ fgColour, bgColour }) => {
  const [swatchAlert, setSwatchAlert] = useState<{ visible: boolean; message: string }>({ visible: false, message: "Copied to Clipboard!" });
  const [renderAlert, setRenderAlert] = useState<{ visible: boolean; message: string }>({ visible: false, message: "Added colors to design canvas!" });

  const fgSwatches: JSX.Element[] = [];
  const bgSwatches: JSX.Element[] = [];

  const fgRecoms: Color[] = findRecoms(fgColour, bgColour);
  const bgRecoms: Color[] = findRecoms(bgColour, fgColour);

  function isArrayEmpty(array: any[]): boolean {
    return array.length === 0;
  }

  async function renderOnCanvas(fgRecoms: Color[], bgRecoms: Color[]) {

    const swatches: NativeSimpleElementWithBox[] = []

    for(let i: number = 0; i < fgRecoms.length; i++) {
      swatches.push(
        {
          type: "SHAPE",
          paths: [
            {
              d: "M 20 10 A 10 10 0 1 0 0 10 A 10 10 0 1 0 20 10",
              fill: {
                color: fgRecoms[i].hexString,
              },
            },
          ],
          viewBox: {
            height: 20,
            width: 20,
            left: 0,
            top: 0,
          },
          width: 20,
          height: 20,
          top: 0,
          left: (25 * i),
        }
      )
    }

    for(let i: number = 0; i < bgRecoms.length; i++) {
      swatches.push(
        {
          type: "SHAPE",
          paths: [
            {
              d: "M 20 10 A 10 10 0 1 0 0 10 A 10 10 0 1 0 20 10",
              fill: {
                color: bgRecoms[i].hexString,
              },
            },
          ],
          viewBox: {
            height: 20,
            width: 20,
            left: 0,
            top: 0,
          },
          width: 20,
          height: 20,
          top: 25,
          left: (25 * i),
        }
      )
    }

    await addNativeElement({
      type: "GROUP",
      children: swatches,
    })

    .then(() => {
      setRenderAlert({ visible: true, message: "Added colors to design canvas!" });
      setTimeout(() => setRenderAlert({ visible: false, message: "" }), 7000);
    })
    .catch(err => console.error('Failed to copy: ', err));
  }


  const handleSwatchClick = (colour: string) => {
    navigator.clipboard.writeText(colour)
      .then(() => {
        setSwatchAlert({ visible: true, message: `Color code ${colour} copied to clipboard!` });
        setTimeout(() => setSwatchAlert({ visible: false, message: "" }), 7000);
      })
      .catch(err => console.error('Failed to copy: ', err));
  };


  for (const fgCol of fgRecoms) {
    fgSwatches.push(
      <Box padding="0.5u">
        <Swatch
          fill={[fgCol.hexString]}
          onClick={() => handleSwatchClick(fgCol.hexString)}
          size="small"
          variant="solid"
        />
      </Box>
    );
  };

  for (const bgCol of bgRecoms) {
    bgSwatches.push(
      <Box padding="0.5u">
        <Swatch 
          fill={[bgCol.hexString]}
          onClick={() => handleSwatchClick(bgCol.hexString)}
          size="small"
          variant="solid"
        />
      </Box>
    )
  };

  return (
    <Rows spacing="2u">
      <Rows spacing="0">
        <Title size="medium">Recommended Colors</Title>
        {(!isArrayEmpty(bgRecoms) || !isArrayEmpty(fgRecoms)) && <Text size="small">Click on a swatch to copy the color code</Text>}
      </Rows>
      {swatchAlert.visible && (
        <Alert tone="positive">
          {swatchAlert.message}
        </Alert>
      )}
      {isArrayEmpty(fgRecoms) && isArrayEmpty(bgRecoms) &&
        <Alert tone="info">There are no recommendations for this color combo</Alert>
      }

      {!isArrayEmpty(fgRecoms) && 
        <div>
          <Box paddingBottom="1u">
            <Text size="medium">Foreground</Text>
          </Box>
          <Box display="flex" flexDirection="row" padding="0">
            {fgSwatches}
          </Box>
        </div>}
      {!isArrayEmpty(bgRecoms) && 
        <div>
          <Box paddingBottom="1u">
            <Text size="medium">Background</Text>
          </Box>
          <Box display="flex" flexDirection="row" padding="0">
            {bgSwatches}
          </Box>
        </div>}
      {(!isArrayEmpty(bgRecoms) || !isArrayEmpty(fgRecoms)) && 
        <Rows spacing="1u">
          <Button variant="primary" onClick={() => renderOnCanvas(fgRecoms, bgRecoms)}>
            Add recommended colors to canvas
          </Button>
          {renderAlert.visible && (
          <Alert tone="positive">
            {renderAlert.message}
          </Alert>)}
          <Text size="small">This adds all the recommendations to your Document Colors so you can easily apply them on your designs</Text>
        </Rows>
      }   
    </Rows>
  )
};