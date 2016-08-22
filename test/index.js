var expect = require('chai').expect;
var AWS = require('aws-sdk-mock');

var cloudwatchMetric = require('..');

var attachHook = (hook) => AWS.mock('CloudWatch', 'putMetricData', hook);

describe('cloudwatch-metrics', function() {
  it('should buffer until timeout', function(done) {
    attachHook(function(data, cb) {
      expect(data).to.deep.equal({
        MetricData: [{
          Dimensions: [{
            Name: "environment",
            Value: "PROD"
          }, {
            Name: "ExtraDimension",
            Value: "Value"
          }],
          MetricName: "metricName",
          Unit: "Count",
          Value: 1
        }],
        Namespace: 'namespace'
      });
      cb();
    });

    var metric = new cloudwatchMetric.Metric('namespace', 'Count', [{
      Name: 'environment',
      Value: 'PROD'
    }], {
      sendInterval: 1000,
      sendCallback: done
    });

    metric.put(1, 'metricName', [{Name:'ExtraDimension',Value: 'Value'}]);
    AWS.restore('CloudWatch', 'putMetricData');
  });

  it('should buffer until the cap is hit', function(done) {
    attachHook(function(data, cb) {
      expect(data).to.deep.equal({
        MetricData: [{
          Dimensions: [{
            Name: "environment",
            Value: "PROD"
          }, {
            Name: "ExtraDimension",
            Value: "Value"
          }],
          MetricName: "metricName",
          Unit: "Count",
          Value: 1
        }, {
          Dimensions: [{
            Name: "environment",
            Value: "PROD"
          }, {
            Name: "ExtraDimension",
            Value: "Value"
          }],
          MetricName: "metricName",
          Unit: "Count",
          Value: 2
        }],
        Namespace: 'namespace'
      });
      cb();
    });

    var metric = new cloudwatchMetric.Metric('namespace', 'Count', [{
      Name: 'environment',
      Value: 'PROD'
    }], {
      sendInterval: 3000, // mocha defaults to a 2 second timeout so setting
                          // larger than that will cause the test to fail if we
                          // hit the timeout
      sendCallback: done,
      maxCapacity: 2
    });

    metric.put(1, 'metricName', [{Name:'ExtraDimension',Value: 'Value'}]);
    metric.put(2, 'metricName', [{Name:'ExtraDimension',Value: 'Value'}]);
    AWS.restore('CloudWatch', 'putMetricData');
  });
});
