const vscode = require('vscode');

const activate = (context) => {
	const command = vscode.commands.registerCommand('importsSorter.sort', () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) return;

		const selectedText = editor.document.getText(editor.selection);
		const lines = selectedText.split(/;/);

		const coreBlock = [];
		const libsBlock = [];
		const generalGroup = [];
		const globalComponentsBlock = [];
		const localComponentsBlock = [];
		const unknownBlock = [];

		const LINE_TYPES = {
			Core: '1',
			Libs: '2',
			GlobalComponents: '3',
			LocalComponents: '4',
			General: '5',
		};

		const getLineType = (line) => {
			const typesMap = {
				[LINE_TYPES.Core]: /(from|import) (('|")react('|")|('|")react-native('|")|('|")vue('|"))/g,
				[LINE_TYPES.Libs]: /(from|import) ('|")@?\w/g,
				[LINE_TYPES.GlobalComponents]: /(from|import) ('|")(~|@)\/components/ig,
				[LINE_TYPES.LocalComponents]: /(from|import) ('|").\/components/ig,
				[LINE_TYPES.General]: /(from|import) ('|")((~|.+|@)\/)+/g,
			};

			return (Object.entries(typesMap)
				.find(([, value]) => line.match(value)) || [])[0];
		};

		const getBlockString = (block) => {
			return block
				.map((line) => line.includes(';') ? line : `${line};`)
				.map((line) => `${line.replace(/^[\r\n]+|[\r\n]+$/g, '')}\n`)
				.sort((a, b) => a.length - b.length)
				.join('');
		};

		const addLine = (line, block) => {
			if (!line ||/^\n?\s+\n?$/.test(line) || block.includes(line)) {
				return;
			}

			block.push(line);
		};

		lines.forEach((line) => {
			switch (getLineType(line)) {
				case LINE_TYPES.Core:
					addLine(line, coreBlock);
					break;
				case LINE_TYPES.Libs:
					addLine(line, libsBlock);
					break;
				case LINE_TYPES.GlobalComponents:
					addLine(line, globalComponentsBlock);
					break;
				case LINE_TYPES.LocalComponents:
					addLine(line, localComponentsBlock);
					break;
				case LINE_TYPES.General:
					addLine(line, generalGroup);
					break;
				default:
					addLine(line, unknownBlock);
					break;
			}
		});
		
		const categorizedGeneral = generalGroup.reduce((groups, line) => {
			const groupName = line.match(/(@|~|\.+)?\/([\w-]+)/)?.[2];

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
		.join('\n')
		.replace(/\n+$/, '');

		editor.edit(editBuilder => editBuilder.replace(editor.selection, importBlocks));
	});

	context.subscriptions.push(command);
};

const deactivate = () => {};

module.exports = {
	activate,
	deactivate,
};
