# Contributing to Sit-Down-And-Play

Thanks for contributing.

## Code of Conduct

Use your best judgment and always communicate in a problem-solving, positive language. 

## How Can I Contribute?

### Reporting Bugs

You can report bugs and issues at any time. As many information as possible will always be helpful in reproducing and (finally) fixing the issue.

### Enhancements

Enhancements can be suggested via the issue report system. Please be specific to avoid confusion.

### Pull Requests

You can fork this project, implement your code changes and create a pull request.

## Some Guides

### Dependencies

Please avoid any further dependency. Although they come in quite handy, a dependency adds another layer to this project that has to be maintained.

Especially in the frontend Javascript, dependencies may slow the code down significantly.

### JavaScript

Although it is not yet the default way, please use a similar approach to your modules:

* Rather use classes
* Update/Create a unit test for your changes (if possible)


```
// Use this:
export default class ClassName {

}

// Instead of:
class ClassName {

}
export default ClassName
```