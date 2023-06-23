import type * as C from '@effect/data/Context';
import type * as Effect from '@effect/io/Effect';
import type {
  FieldKind,
  FieldOptionsFromKind,
  FieldRef,
  InputFieldMap,
  OutputShape,
  SchemaTypes,
  TypeParam,
} from '@pothos/core';
import type { GraphQLResolveInfo } from 'graphql';

export type DropFirst<T extends readonly unknown[]> = T extends [any?, ...infer U] ? U : [...T];

export type First<T extends readonly unknown[]> = T extends [infer U, ...unknown[]] ? U : never;

export type Service = C.Tag<any, any>;

export type ServiceEntry = [Service, any];

export type InferService<T> = T extends ServiceEntry ? T[0] extends C.Tag<any, infer U> ? U
  : never
  : never;

export type Context = C.Context<any>;

export type InferContext<T> = T extends C.Context<infer U> ? U : never;

export type InferRequirementsFromServiceEntries<T, Acc = never> = T extends readonly [infer U, ...infer V]
  ? InferRequirementsFromServiceEntries<V, Acc | InferService<U>>
  : Acc;

export type EffectFieldReturnType<
  Types extends SchemaTypes,
  Type extends TypeParam<Types>,
  $ServiceEntries extends readonly ServiceEntry[],
  $Context extends Context,
> = Effect.Effect<
  | InferContext<$Context>
  | InferRequirementsFromServiceEntries<$ServiceEntries>,
  unknown,
  OutputShape<Types, Type>
>;

export type EffectFieldOptions<
  // Pothos Types:
  Types extends SchemaTypes,
  ParentShape,
  Type extends TypeParam<Types>,
  Args extends InputFieldMap,
  ResolveReturnShape,
  // Effect Types:
  $ServiceEntries extends readonly ServiceEntry[],
  $Context extends Context,
  $EffectFieldReturnType extends EffectFieldReturnType<
    Types,
    Type,
    $ServiceEntries,
    $Context
  > = EffectFieldReturnType<
    Types,
    Type,
    $ServiceEntries,
    $Context
  >,
  // Pothos Types:
  Kind extends FieldKind = FieldKind,
> =
  & Omit<
    FieldOptionsFromKind<
      Types,
      ParentShape,
      Type,
      false,
      Args,
      Kind,
      ParentShape,
      ResolveReturnShape
    >,
    'resolve'
  >
  & {
    effect?: {
      context?: (context: Types['Context']) => $Context;
      services?: (context: Types['Context']) => $ServiceEntries;
      // To be done:
      // layer: (context: Types['Context']) => unknown;
    };
    resolve(
      parent: ParentShape,
      args: Args,
      context: Types['Context'],
      info: GraphQLResolveInfo,
    ): $EffectFieldReturnType;
  };

export type EffectField<
  Types extends SchemaTypes,
  ParentShape,
> = <
  // Pothos Types:
  Args extends InputFieldMap,
  Type extends TypeParam<Types>,
  ResolveShape,
  // Effect Types:
  $ServiceEntries extends
    | readonly []
    | readonly [ServiceEntry, ...ServiceEntry[]],
  $Context extends Context,
>(
  options: EffectFieldOptions<
    Types,
    ParentShape,
    Type,
    Args,
    ResolveShape,
    $ServiceEntries,
    $Context
  >,
) => FieldRef<unknown>;
