const vscode = require('vscode');

enum LineTypes {
	Core,
	Libs,
	GlobalComponents,
	LocalComponents,
	General,
}

const activate = (context) => {
	const command = vscode.commands.registerCommand('importsSorter.sort', () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) return;

		const selectedText: string = editor.document.getText(editor.selection);
		const lines: string[] = selectedText.split(/;|(?<=['"])\r?\n/);
		const withFinalBreakLine: boolean = selectedText.endsWith('\n');

		const coreBlock = [];
		const libsBlock = [];
		const generalGroup = [];
		const globalComponentsBlock = [];
		const localComponentsBlock = [];
		const unknownBlock = [];

		const removeBreakLines = (text) => text.replace(/[\r\n]+/g, '');

		const getLineType = (line: string) => {
			let matched: LineTypes;

			const types = new Map([
				[LineTypes.Core, /(from|import) (('|")react('|")|('|")react-native('|")|('|")vue('|"))/g],
				[LineTypes.Libs, /(from|import) ('|")@?\w/g],
				[LineTypes.GlobalComponents, /(from|import) ('|")(~|@)\/components/ig],
				[LineTypes.LocalComponents, /(from|import) ('|").\/components/ig],
				[LineTypes.General, /(from|import) ('|")((~|.+|@)\/)+/g],
			]);

			types.forEach((value, key) => {
				if (matched in LineTypes) return;

				if (line.match(value)) {
					matched = key;
				}
			});

			return matched;
		};

		const getBlockString = (block: string[]) => {
			return block
				.map((line) => `${line};`)
				.map((line) => `${line.replace(/^[\r\n]+|[\r\n]+$/g, '')}\n`)
				.sort((a, b) => a.length - b.length)
				.join('');
		};

		const addLine = (newLine: string, block: string[]) => {
			const invalidLine = !newLine || /^\n?\s+\n?$/.test(newLine);
			const lineAlreadyExists = block.some((line) => removeBreakLines(newLine) === removeBreakLines(line));

			if (invalidLine || lineAlreadyExists) return;

			block.push(newLine);
		};

		lines.forEach((line: string) => {
			switch (getLineType(line)) {
				case LineTypes.Core:
					addLine(line, coreBlock);
					break;
				case LineTypes.Libs:
					addLine(line, libsBlock);
					break;
				case LineTypes.GlobalComponents:
					addLine(line, globalComponentsBlock);
					break;
				case LineTypes.LocalComponents:
					addLine(line, localComponentsBlock);
					break;
				case LineTypes.General:
					addLine(line, generalGroup);
					break;
				default:
					addLine(line, unknownBlock);
					break;
			}
		});

		const categorizedGeneral = generalGroup.reduce((groups, line) => {
			const samePath = /\.\//g.test(line);
			const justAFolder = line.match(/\//g)?.length === 1;
			const groupName = (samePath && justAFolder)
				? 'samePath'
				: line.match(/((@|~|\.+)?\/)+([\w-]+)/)[3];

			if (groups[groupName]) groups[groupName].push(line);
			else groups[groupName] = [line];

			return groups;
		}, {});

		const generalBlocks = Object.entries(categorizedGeneral)
			.sort(([keyA], [keyB]) => keyA > keyB ? 1 : -1)
			.map(([, block]) => block)
		
		const importBlocks = [
			getBlockString(coreBlock),
			getBlockString(libsBlock),
			...generalBlocks.map(getBlockString),
			getBlockString(globalComponentsBlock),
			getBlockString(localComponentsBlock),
			getBlockString(unknownBlock),
		]

		const importsBlockStr = importBlocks
			.filter(Boolean)
			.join('\n')
			.replace(/\n+$/, '')

		editor.edit(editBuilder => {
			editBuilder.replace(
				editor.selection,
				importsBlockStr.concat(withFinalBreakLine ? '\n' : ''),
			);
		});
	});

	context.subscriptions.push(command);
};

const deactivate = () => {};

module.exports = {
	activate,
	deactivate,
};
