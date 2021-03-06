"use strict";

const React = require('react');

const transformChildren = require("./lib/transform-children");
const reduceRefs = require("./lib/reduce-refs");
const omit = require("./lib/util/omit");

class FieldWrapper extends React.Component {
    get fields() {
        return reduceRefs(this.refs);
    }

    get values() {
        var fields = this.fields;

        return Object.keys(fields).reduce(function(values, key) {
            var field = fields[key];
            var value;

            if (Array.isArray(field)) {
                value = field.reduce(function(values, field) {
                    if (field.isRadio && field.isChecked)
                        return field.getValue();

                    if (field.isCheckbox && field.isChecked)
                        values.push(field.getValue());

                    return values;
                }, []);
            } else {
                value = field.getValue();
            }

            values[key] = value;
            return values;
        }, {});
    }

    get isTentativelyValid() {
        var fields = this.fields;

        return Object.keys(fields).reduce(function(validated, key) {
            var field = fields[key];

            if (!field.isTentativelyValid)
                return validated;

            validated[key] = field.isTentativelyValid();
            return validated;
        }, {});
    }

    validate(done) {
        var fields = this.fields;
        var values = this.values;

        var errors = Object.keys(fields).reduce(function(errors, key) {
            if (!fields[key].validate) return errors;

            var error = fields[key].validate(values[key], values);

            if (error)
                errors[key] = error;

            return errors;
        }, {});

        if (Object.keys(errors).length == 0)
            errors = undefined;

        return done(errors, values);
    }

    render() {
        let props = omit(this.props, "defaultValues", "type");

        props.onSubmit = this.onSubmit;
        props.noValidate = true;

        return React.createElement(this.props.type, props, transformChildren(this.props.children, 0));
    }

}

FieldWrapper.propTypes = {
    type: (props, propName, componentName) => {
        const value = props[propName];

        if (typeof value !== "string")
            return new Error("Validation failed: expected type to be a string");

        if (value == "form")
            return new Error("Validation warning: type should not be \"form\"");
    }
};

FieldWrapper.defaultProps = {
    type: "div"
};

module.exports = FieldWrapper;
