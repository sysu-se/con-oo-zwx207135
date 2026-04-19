# con-oo-zwx207135 - Review

## Review 结论

当前提交更像是“基于多个全局 Svelte store 的状态实现”，而不是把 Sudoku/Game 作为领域核心接入 UI。开始新局、渲染棋盘、输入数字、提示和暂停等流程在静态结构上已经接入 Svelte，但关键的领域建模没有落地：没有真正的 Sudoku/Game 对象、没有历史管理、Undo/Redo 未实现，且用户输入仍绕过统一领域接口直接改 store，因此本次作业的核心目标没有完成。

## 总体评价

| 维度 | 评价 |
| --- | --- |
| OOP | poor |
| JS Convention | fair |
| Sudoku Business | fair |
| OOD | poor |

## 缺点

### 1. 缺少真正的 Sudoku / Game 领域对象

- 严重程度：core
- 位置：src/domain/*（目录缺失）; src/node_modules/@sudoku/sudoku.js:1-84; src/node_modules/@sudoku/game.js:1-57
- 原因：作业要求的领域层文件 `src/domain/*` 不存在，实际代码中的 `sudoku.js` 只是生成/求解工具函数，`game.js` 只是若干过程式入口；没有对象持有当前 Sudoku、没有 `guess`/校验/外表化/历史演进能力，也没有明确的对象边界。这不符合 OOP，也不符合本次作业要求的领域核心。

### 2. Undo / Redo 完全未实现，也没有接入游戏流程

- 严重程度：core
- 位置：src/components/Controls/ActionBar/Actions.svelte:26-36; src/node_modules/@sudoku/game.js:1-57
- 原因：UI 上有 Undo/Redo 按钮，但没有 `on:click`，代码库里也没有 history、undo、redo 的实现。作业明确要求 `Game` 管理历史并向 UI 暴露撤销/重做入口，这一块当前是缺失的。

### 3. 用户输入仍然直接操作 store，而不是通过统一的 Game / Sudoku 接口

- 严重程度：core
- 位置：src/components/Controls/Keyboard.svelte:10-25; src/components/Controls/ActionBar/Actions.svelte:13-20; src/components/Board/Cell.svelte:39
- 原因：键盘输入直接调用 `userGrid.set`、`userGrid.applyHint`、`candidates.add/clear`、`cursor.move/set`。这说明 View 层仍在直接编排领域状态，领域逻辑没有成为 UI 的唯一入口，不符合“View 真正消费领域对象”的要求，也削弱了 OOD 中的封装与职责边界。

### 4. 提示功能没有依赖权威解，而是临时对当前用户盘面求解

- 严重程度：major
- 位置：src/node_modules/@sudoku/stores/grid.js:80-86
- 原因：`applyHint` 直接对当前 `userGrid` 调用 `solveSudoku($userGrid)`，说明系统没有保存题目的权威解或可靠快照。这样提示结果会依赖用户当前输入的临时状态；当用户已填错或盘面不一致时，提示的正确性和稳定性都没有领域保证。从数独业务上，hint 应该来自原题对应的唯一解，而不是来自用户当前可变状态。

### 5. Game 模块是全局状态编排器，不是可实例化的游戏会话对象

- 严重程度：major
- 位置：src/node_modules/@sudoku/game.js:13-21; src/node_modules/@sudoku/game.js:28-34; src/node_modules/@sudoku/game.js:39-49; src/node_modules/@sudoku/stores/*.js
- 原因：`game.js` 通过导入全局 singleton store 来驱动 `difficulty`、`grid`、`cursor`、`timer`、`hints`，还直接操作 `location.hash`。这让“游戏”变成了模块级全局状态，而不是一个可持有、可替换、可测试的会话对象；既不利于复用，也不利于把 UI 与领域解耦。

### 6. 候选数数据模型过于临时化，JS 习惯与 OOD 都较弱

- 严重程度：minor
- 位置：src/node_modules/@sudoku/stores/candidates.js:9-27
- 原因：候选数使用 `"x,y"` 字符串键的普通对象，值是数组，并通过 `delete array[index]` 删除元素。这样会产生稀疏数组，数据结构语义也不明确。对于候选数这种集合语义，更合理的是显式 value object、二维结构或 `Set`，当前写法可用但不够稳健、也不够符合 JS 生态惯例。

## 优点

### 1. 固定题面与玩家作答被分成了两层状态

- 位置：src/node_modules/@sudoku/stores/grid.js:7-18; src/node_modules/@sudoku/stores/grid.js:44-68
- 原因：`grid` 保存题面，`userGrid` 保存玩家当前盘面，并在开局/载入时由题面复制出用户盘面。这比把所有状态混在一个二维数组里更符合数独业务，也为“固定数字不可编辑”提供了清晰基础。

### 2. 冲突检测和胜利判定被抽成了响应式派生状态

- 位置：src/node_modules/@sudoku/stores/grid.js:93-137; src/node_modules/@sudoku/stores/game.js:7-20
- 原因：`invalidCells` 和 `gameWon` 都通过 `derived` 从棋盘状态推导出来，避免把这些规则散落在组件模板里。这一层对 Svelte 的响应式消费是自然的，组件只读结果，不自己重算规则。

### 3. 开始新局和载入自定义题目至少有集中入口

- 位置：src/node_modules/@sudoku/game.js:13-34; src/components/Modal/Types/Welcome.svelte:16-24; src/components/Header/Dropdown.svelte:11-23; src/components/Header/Dropdown.svelte:41-55
- 原因：`startNew` / `startCustom` 统一负责重置 difficulty、grid、cursor、timer、hints，Svelte 侧没有把“开局”逻辑完全散落到多个组件里。这说明作者已经意识到流程入口需要收敛。

### 4. 棋盘渲染层主要以声明式方式消费 store

- 位置：src/components/Board/index.svelte:40-52
- 原因：Board 组件直接根据 `$userGrid`、`$grid`、`$cursor`、`$invalidCells`、`$settings` 渲染每个 Cell 的状态，界面刷新的依赖关系是清晰的，体现了 Svelte store 的基本用法。

## 补充说明

- 本次结论完全基于静态阅读，未运行测试，也未做任何运行时验证。
- 题目要求审查 `src/domain/*`，但当前仓库中该目录不存在；本次只能将 `src/node_modules/@sudoku/*` 视为实际承担领域职责的代码来审查。
- 关于提示逻辑、领域边界和 Svelte 接入的判断，均来自代码路径分析，而非实际点击流程验证。
