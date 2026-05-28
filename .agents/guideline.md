    # Guidelines

    ## Indentation
    - Use 4 spaces for indentation (not tabs)
    - Never mix tabs and spaces in the same file

    ## Testing
    - Tests must use vitest framework
    - Test files go in tests/ directory mirroring source structure
    - Naming pattern: tests/path/to/file.test.ts
    - Examples:
      - Source: src/lib/game/config/index.ts
      - Test: tests/lib/game/config/index.test.ts

    ## Browser tests
    - Use jsdom environment for browser-dependent code
    - Tests using window, document, DOM elements need jsdom
    - Tests must use window.dispatchEvent() to simulate events