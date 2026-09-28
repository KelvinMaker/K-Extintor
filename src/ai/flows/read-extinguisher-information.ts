'use server';

/**
 * @fileOverview Este archivo define un flujo de Genkit para extraer información de extintores de una imagen.
 *
 * - readExtinguisherInformation - Una función que toma una imagen de la etiqueta de un extintor y devuelve la fecha de recarga y el tipo de extintor.
 * - ReadExtinguisherInformationInput - El tipo de entrada para la función readExtinguisherInformation.
 * - ReadExtinguisherInformationOutput - El tipo de retorno para la función readExtinguisherInformation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReadExtinguisherInformationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'Una foto de la etiqueta de un extintor, como un URI de datos que debe incluir un tipo MIME y usar codificación Base64. Formato esperado: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type ReadExtinguisherInformationInput = z.infer<
  typeof ReadExtinguisherInformationInputSchema
>;

const ReadExtinguisherInformationOutputSchema = z.object({
  dateOfManufacture: z // Variable name remains, but contextually it's for "Fecha de Recarga"
    .string()
    .describe('La fecha de recarga del extintor.'),
  typeOfExtinguisher: z.string().describe('El tipo de extintor.'),
});
export type ReadExtinguisherInformationOutput = z.infer<
  typeof ReadExtinguisherInformationOutputSchema
>;

export async function readExtinguisherInformation(
  input: ReadExtinguisherInformationInput
): Promise<ReadExtinguisherInformationOutput> {
  return readExtinguisherInformationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'readExtinguisherInformationPrompt',
  input: {schema: ReadExtinguisherInformationInputSchema},
  output: {schema: ReadExtinguisherInformationOutputSchema},
  prompt: `Eres un experto en leer etiquetas de extintores.

Extraerás la fecha de recarga y el tipo de extintor de la siguiente imagen.

Imagen: {{media url=photoDataUri}}

Fecha de Recarga: {{dateOfManufacture}}
Tipo de Extintor: {{typeOfExtinguisher}}`,
});

const readExtinguisherInformationFlow = ai.defineFlow(
  {
    name: 'readExtinguisherInformationFlow',
    inputSchema: ReadExtinguisherInformationInputSchema,
    outputSchema: ReadExtinguisherInformationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
