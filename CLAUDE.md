# Project Guidelines

## File Naming

- Always use dashes (`-`) instead of underscores (`_`) as word separators in file names (e.g., `my-file.ts`, not `my_file.ts`).

## Function Parameter Objects

When a function takes a single object parameter (the "params pattern"), always define the object's type as a named type above the function — never inline it in the signature.

- Name the type `<FunctionName>Params` (e.g., `createUser` → `CreateUserParams`).
