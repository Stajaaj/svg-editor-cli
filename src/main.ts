import { EditorApplication } from './cli/EditorApplication';
import { Repl } from './cli/Repl';

new Repl(new EditorApplication()).start();
