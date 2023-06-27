import * as Context from '@effect/data/Context';
import { pipe } from '@effect/data/Function';
import * as Effect from '@effect/io/Effect';
import { FieldKind, RootFieldBuilder, SchemaTypes } from '@pothos/core';
import { GraphQLError } from 'graphql';

const fieldBuilderProto = RootFieldBuilder.prototype as PothosSchemaTypes.RootFieldBuilder<
  SchemaTypes,
  unknown,
  FieldKind
>;

fieldBuilderProto.effect = function effect({ effect = {}, resolve, ...options }) {
  return this.field({
    ...options,
    resolve: (async (parent: any, args: any, context_: any, info: any) => {
      // TODO: Build services, layer from this.builder.options.
      let context = Context.empty();

      if ('services' in effect && effect.services) {
        const serviceEntries = effect.services(context_);

        for (const [tag, value] of serviceEntries) {
          context = Context.add(context, tag, value);
        }
      }

      if ('context' in effect && effect.contexts) {
        context = Context.merge(context, effect.contexts(context_));
      }

      const program = pipe(
        resolve(parent, args, context_, info) as Effect.Effect<never, never, any>,
        Effect.provideContext(context),
      );

      const result = await Effect.runPromiseExit(program);

      if (result._tag === 'Success') {
        return result.value;
      }

      throw new GraphQLError('Failure', {
        originalError: result.cause._tag === 'Die' ? result.cause.defect as Error : null,
      });
    }) as never,
  });
};
