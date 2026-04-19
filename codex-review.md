# con-oo-zwx207135 - Review

## Review 结论

当前实现已经出现了“用 custom store 适配领域对象”的正确方向，但并没有把 `Game`/`Sudoku` 真正变成唯一的游戏核心。开局、胜负、分享、暂停等关键流程仍然依赖旧 `@sudoku/*` 状态链，导致真实接入未完成；同时领域对象本身对数独规则的建模过薄，难以支撑业务约束与 UI 一致性。

## 总体评价

| 维度 | 评价 |
| --- | --- |
| OOP | fair |
| JS Convention | fair |
| Sudoku Business | poor |
| OOD | poor |

## 缺点

### 1. 开始一局游戏的主流程没有真正接入领域对象

- 严重程度：core
- 位置：src/App.svelte:20-46; src/components/Modal/Types/Welcome.svelte:16-24; src/components/Header/Dropdown.svelte:11-23,41-55; src/stores/gameStore.js:9-20
- 原因：`App` 只在挂载时用全 0 棋盘初始化一次 `gameStore`，而欢迎弹窗和下拉菜单里的“开始新局/载入题目”仍调用旧的 `@sudoku/game.startNew/startCustom`。结果是题目生成与加载绕过了 `Game`/`Sudoku`，而棋盘渲染却读取 `$gameStore.grid`，这不满足作业要求中的“真实游戏流程由领域对象驱动”。

### 2. 应用存在两个彼此独立的状态源，游戏生命周期不以当前 Game 为准

- 严重程度：core
- 位置：src/App.svelte:13-17; src/components/Modal/Types/Share.svelte:5-17; src/components/Controls/ActionBar/Timer.svelte:2-9; src/node_modules/@sudoku/stores/game.js:1-20; src/node_modules/@sudoku/stores/grid.js:7-91
- 原因：棋盘输入和撤销/重做来自 `gameStore`，但胜利判断、分享编码、暂停/恢复、计时等流程仍依赖旧的 `@sudoku` stores。这样 UI 没有单一事实来源：静态阅读可见 `gameWon` 基于旧 `userGrid/invalidCells`，`Share` 也编码旧 `grid`，因此当前领域对象状态无法完整驱动游戏流程。

### 3. Sudoku 没有建模数独规则与固定格约束

- 严重程度：core
- 位置：src/domain/Sudoku.js:2-14
- 原因：`Sudoku` 目前只是二维数组包装器，`guess` 直接写入 `this.grid[row][col] = value`，没有行/列/宫校验，没有数值范围约束，也没有“题面给定数字不可覆盖”和“用户输入”这类业务语义。作业要求中的“提供校验能力”没有落实，数独业务建模明显不足。

### 4. Hint 逻辑被接错，点击提示实际写入 null

- 严重程度：major
- 位置：src/components/Controls/ActionBar/Actions.svelte:13-19; src/domain/Sudoku.js:12-14
- 原因：`handleHint` 最终调用的是 `gameStore.guess({ ..., value: null })`，这既没有应用提示答案，也把本应为数字网格的领域状态写成了 `null`。这不符合数独“提示”业务，也破坏了 `Sudoku` 的数据不变式。

### 5. Game 直接暴露可变的 Sudoku，破坏封装与历史一致性

- 严重程度：major
- 位置：src/domain/Game.js:12-14; src/domain/Sudoku.js:12-18
- 原因：`getSudoku()` 返回内部可变对象本身，外部调用者可以绕过 `Game.guess()` 直接对 `Sudoku` 调用 `guess()`，从而跳过 undo/redo 管理。对于聚合根来说，这会让历史栈和真实状态脱节，不是好的 OOD。

### 6. toJSON 暴露了内部可变引用，不是安全的外表化

- 严重程度：major
- 位置：src/domain/Sudoku.js:20-24; src/domain/Game.js:49-54
- 原因：`Sudoku.toJSON()` 直接返回 `this.grid`，而不是返回深拷贝后的纯数据快照；`Game.toJSON()` 也沿用了这个结果。调用方如果修改返回值，会从序列化出口反向污染领域对象内部状态，这不符合常见 JS 序列化约定。

### 7. Svelte 适配层过薄，组件契约与新状态模型已经脱节

- 严重程度：minor
- 位置：src/stores/gameStore.js:15-20; src/components/Board/index.svelte:12-24,34-42; src/components/Board/Cell.svelte:10-17
- 原因：`gameStore` 只暴露了 `grid/canUndo/canRedo`，但 `Cell` 仍保留 `candidates/conflictingNumber/userNumber/sameArea/sameNumber` 等旧契约；`Board` 里甚至保留了 `isSameArea()` 却没有把结果传给子组件。这说明迁移只做了一半，领域层与视图层的边界没有设计完整。

## 优点

### 1. 对输入和读取结果都做了防御性拷贝

- 位置：src/domain/Sudoku.js:3-10
- 原因：构造函数复制入参，`getGrid()` 也返回拷贝，避免了外部直接持有内部二维数组引用，这是领域对象最基本但重要的封装措施。

### 2. Undo/Redo 的基本状态迁移清晰

- 位置：src/domain/Game.js:16-25,27-39
- 原因：`guess()` 先保存快照、再清空 redo；`undo()` 和 `redo()` 也分别维护双栈，基本流程正确，说明作者已经把历史管理收敛到 `Game` 内部。

### 3. 采用 custom store 作为 Svelte 适配层，方向是对的

- 位置：src/stores/gameStore.js:4-44
- 原因：`createGameStore()` 持有领域对象，并通过 `set(...)` 暴露给 Svelte 可订阅快照，这符合题目推荐的 Store Adapter 方案，也比在组件里直接改数组更接近正确架构。

### 4. 部分关键交互已经改为经过 store 调用领域接口

- 位置：src/components/Board/index.svelte:8-10,34-44; src/components/Controls/Keyboard.svelte:22-26; src/components/Controls/ActionBar/Actions.svelte:27-39
- 原因：棋盘渲染读取 `$gameStore.grid`，数字输入、撤销、重做也通过 `gameStore` 方法进入领域层，说明“View 不直接改数组”的意识已经开始落实。

## 补充说明

- 本次结论严格基于静态阅读，按要求未运行测试，也未手动操作页面流程。
- 关于“开始新局未接入”“胜利/分享与当前棋盘脱节”“Hint 行为错误”等判断，来自对 `src/domain/*`、`src/stores/gameStore.js` 与相关 Svelte 组件调用链的静态比对，不是运行时观测结果。
- 审查范围只覆盖了 `src/domain/*` 及其关联的 Svelte 接入点；未扩展评价无关目录中的其他实现细节。
