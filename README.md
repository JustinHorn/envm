# ENV Manager

You often have to switch env variables and can not or want not to code the change into your program? This command line tool allows you to save your env values as a rotations and swap them around by need. Without creating a new file in your project that could accidentally get committed.

On your first use of envm, it will prompt you to create a config.
Example config:

```
envLocation=./local/path/to/you're/.env
rotatingVars=some_variable,anotherVariable
```

some_variable and anotherVariable variable will be saved when you create a new rotation. A rotation is basicly just a save of the to be rotated variables.

Use `envm -s rotationName` to save the current values as rotation "rotationName". If you use the same name again you override the latest safe.

Use `envm -a rotationName` to apply a safe/rotation.

Use `envm -l` to list the rotations you have saved and `envm -l rotationName` to show the specifics of a rotation. You can delete a rotation with `envm -ld rotationName`.

You can use `envm -o` to modify the config, in case you move the .env or want to start memorizing other variables names in the rotations. A change to the config does not modify existing rotations and they will get applied as they have been saved.

### How to install

- git clone this package
- run `bun install`
- run `bun link`

then you should be able to use this tool like `envm ...` in your console.  
This tool only works on UNIX based/related operating systems.
